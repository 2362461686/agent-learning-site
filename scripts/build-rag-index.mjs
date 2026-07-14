/**
 * RAG 索引构建脚本
 *
 * 在 prebuild 时运行，读取 posts/*.md，切分段落，
 * 生成 TF-IDF 向量，输出到 public/rag-index.json。
 */

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = join(__dirname, '..', 'posts');
const OUTPUT_PATH = join(__dirname, '..', 'public', 'rag-index.json');
const CHUNK_SIZE = 300; // 目标段落字数
const MAX_VOCAB = 2000; // 词汇表上限

// ---------------------------------------------------------------------------
// 中文/混合文本分词：单字 + 二字 bigram
// ---------------------------------------------------------------------------
function* tokenize(text) {
  const cleaned = text.replace(/[^\u4e00-\u9fff\w]/g, ' ').trim();
  // 按空白分隔出 "词" 序列（含英文单词、中文段落）
  const segments = cleaned.split(/\s+/).filter(Boolean);
  for (const seg of segments) {
    if (/^[\u4e00-\u9fff]+$/.test(seg)) {
      // 中文字符 → 单字 + 二字 bigram
      for (let i = 0; i < seg.length; i++) {
        yield seg[i];
        if (i + 1 < seg.length) yield seg[i] + seg[i + 1];
      }
    } else {
      // 英文 / 数字 → 转小写作为单个 token
      yield seg.toLowerCase();
    }
  }
}

// ---------------------------------------------------------------------------
// 段落切片：按自然段落 + 句号/换行切分，尽量不截断句子
// ---------------------------------------------------------------------------
function splitChunks(content) {
  // Step 1: 按双换行（自然段落）切分
  const rawParagraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20); // 太短的忽略

  const chunks = [];
  let buffer = '';

  for (const para of rawParagraphs) {
    // 如果当前段落本身就超过 CHUNK_SIZE，按句号进一步切割
    if (para.length > CHUNK_SIZE * 1.5) {
      // 先刷出 buffer
      if (buffer.length > 20) {
        chunks.push(buffer.trim());
        buffer = '';
      }
      // 按句号切割长段落
      const sentences = para.split(/(?<=[。！？\.\!\?])/);
      for (const sent of sentences) {
        const s = sent.trim();
        if (!s) continue;
        if (buffer.length + s.length <= CHUNK_SIZE) {
          buffer += (buffer ? ' ' : '') + s;
        } else {
          if (buffer.length > 20) chunks.push(buffer.trim());
          buffer = s;
        }
      }
      continue;
    }

    // 常规段落：如果能放入当前 buffer 就合并，否则刷出
    if (buffer.length + para.length <= CHUNK_SIZE) {
      buffer += (buffer ? '\n\n' : '') + para;
    } else {
      if (buffer.length > 20) chunks.push(buffer.trim());
      buffer = para;
    }
  }
  if (buffer.length > 20) chunks.push(buffer.trim());

  return chunks;
}

// ---------------------------------------------------------------------------
// 构建词汇表：统计所有 chunk 的 token 频率，选 top MAX_VOCAB
// ---------------------------------------------------------------------------
function buildVocab(chunks, maxVocab = MAX_VOCAB) {
  const freq = new Map();
  for (const chunk of chunks) {
    const seen = new Set();
    for (const token of tokenize(chunk.content)) {
      freq.set(token, (freq.get(token) || 0) + 1);
      seen.add(token);
    }
    // 记录每篇文档的 token 集合用于 IDF
    chunk._tokenSet = seen;
  }

  // 按频率排序取 top
  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  const vocab = sorted.slice(0, maxVocab).map(([token]) => token);
  const vocabIndex = new Map(vocab.map((t, i) => [t, i]));
  return { vocab, vocabIndex };
}

// ---------------------------------------------------------------------------
// 计算 TF-IDF 向量和 IDF 值
// ---------------------------------------------------------------------------
function computeTfIdf(chunks, vocab, vocabIndex) {
  const N = chunks.length;
  const df = new Array(vocab.length).fill(0); // document frequency

  // 先统计每个 token 出现在多少文档中
  for (const chunk of chunks) {
    for (const token of chunk._tokenSet) {
      const idx = vocabIndex.get(token);
      if (idx !== undefined) df[idx]++;
    }
  }

  const idf = df.map((d) => Math.log((N + 1) / (d + 1)) + 1); // smooth IDF

  const vectors = chunks.map((chunk) => {
    const tf = new Array(vocab.length).fill(0);
    let totalTokens = 0;
    for (const token of tokenize(chunk.content)) {
      const idx = vocabIndex.get(token);
      if (idx !== undefined) {
        tf[idx]++;
        totalTokens++;
      }
    }
    // TF-IDF
    const vec = tf.map((count, i) =>
      totalTokens > 0 ? (count / totalTokens) * idf[i] : 0
    );
    return vec;
  });

  return { vectors, idf, df };
}

// ---------------------------------------------------------------------------
// 序列化向量：稀疏存储（只存非零项）以减小文件体积
// ---------------------------------------------------------------------------
function sparseVector(dense) {
  const sparse = {};
  for (let i = 0; i < dense.length; i++) {
    if (dense[i] > 0) sparse[i] = Math.round(dense[i] * 1e6) / 1e6;
  }
  return sparse;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  console.log('🔨 Building RAG index from posts/...');

  if (!existsSync(POSTS_DIR)) {
    console.error(`✗ Posts directory not found: ${POSTS_DIR}`);
    process.exit(1);
  }

  // 确保 public 目录存在
  const publicDir = dirname(OUTPUT_PATH);
  if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

  // 读取所有 markdown 文章
  const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
  console.log(`   Found ${files.length} posts.`);

  const chunks = [];
  let chunkId = 0;

  for (const file of files) {
    const raw = readFileSync(join(POSTS_DIR, file), 'utf-8');
    const { data, content } = matter(raw);
    const title = data.title || file.replace(/\.md$/, '');
    const slug = file.replace(/\.md$/, '');

    const textChunks = splitChunks(content);

    for (let i = 0; i < textChunks.length; i++) {
      chunks.push({
        id: `${slug}.${i}`,
        title,
        slug,
        content: textChunks[i],
        contentLength: textChunks[i].length,
      });
      chunkId++;
    }
    console.log(`   ${file}: ${textChunks.length} chunks`);
  }

  console.log(`   Total chunks: ${chunks.length}`);

  // 构建词汇表
  const { vocab } = buildVocab(chunks);
  console.log(`   Vocabulary size: ${vocab.length}`);

  // 计算 TF-IDF
  const { vectors } = computeTfIdf(chunks, vocab, new Map(vocab.map((t, i) => [t, i])));

  // 重新计算（因为 buildVocab 已构建 vocabIndex，直接复用）
  const vocabIndexMap = new Map(vocab.map((t, i) => [t, i]));
  const { vectors: finalVectors, idf: _idf } = computeTfIdf(chunks, vocab, vocabIndexMap);

  // 构建输出
  const output = {
    vocab,
    chunkCount: chunks.length,
    builtAt: new Date().toISOString(),
    chunks: chunks.map((chunk, i) => ({
      id: chunk.id,
      title: chunk.title,
      slug: chunk.slug,
      content: chunk.content,
      vector: finalVectors[i],
      // 用 dense 数组保持精度（后续检索时直接用）
    })),
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
  const sizeKB = (Buffer.byteLength(JSON.stringify(output)) / 1024).toFixed(1);
  console.log(`✅ RAG index written to ${OUTPUT_PATH} (${sizeKB} KB)`);
}

main();
