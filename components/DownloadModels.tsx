'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Download, ChevronDown, Brain, Eye, Mic, Volume2, Binary, Router, Award } from 'lucide-react';
import { useState } from 'react';
import { formatBytes } from '@/lib/releases';

interface ModelFile {
  name: string;
  path: string;
  paths?: string[];
  size: number;
}

interface ModelCategory {
  id: string;
  name: string;
  tag: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  files: ModelFile[];
}

const categories: ModelCategory[] = [
  {
    id: 'llm',
    name: 'LLM',
    tag: 'Generation',
    description: 'Large language models for reasoning and response generation.',
    icon: Brain,
    files: [
      { name: 'Qwen3.5-2B-Q4_K_M.gguf', path: 'LLM/Qwen3.5-2B-Q4_K_M.gguf', size: 1280835840 },
      { name: 'LFM-1.2B-INT8.gguf', path: 'LLM/LFM-1.2B-INT8.gguf', size: 1246253536 },
      { name: 'Qwen3.5-0.8B-UD-Q4_K_XL.gguf', path: 'LLM/Qwen3.5-0.8B-UD-Q4_K_XL.gguf', size: 558772480 },
      { name: 'Llama-3.2-1B-Instruct-UD-IQ1_S.gguf', path: 'LLM/Llama-3.2-1B-Instruct-UD-IQ1_S.gguf', size: 421617696 },
    ],
  },
  {
    id: 'vlm',
    name: 'VLM',
    tag: 'Vision-Language',
    description: 'Multimodal model for image + text understanding and visual Q&A.',
    icon: Eye,
    files: [
      { name: 'LFM2.5-VL-1.6B-Q4_0.gguf', path: 'LiquidAI-VLM/LFM2.5-VL-1.6B-Q4_0.gguf', size: 695752480 },
      { name: 'LFM2.5-VL-1.6b-Q8_0.gguf', path: 'LiquidAI-VLM/LFM2.5-VL-1.6b-Q8_0.gguf', size: 583109888 },
      { name: 'mmproj-LFM2.5-VL-1.6b-Q8_0.gguf', path: 'LiquidAI-VLM/mmproj-LFM2.5-VL-1.6b-Q8_0.gguf', size: 583109888 },
    ],
  },
  {
    id: 'asr',
    name: 'ASR',
    tag: 'Speech Recognition',
    description: 'ASR model that transcribes spoken audio into text.',
    icon: Mic,
    files: [
      {
        name: 'Parakeet',
        path: 'parakeet/encoder.int8.onnx',
        paths: [
          'parakeet/encoder.int8.onnx',
          'parakeet/decoder.int8.onnx',
          'parakeet/joiner.int8.onnx',
          'parakeet/tokens.txt',
        ],
        size: 670478772,
      },
    ],
  },
  {
    id: 'tts',
    name: 'TTS',
    tag: 'Text-to-Speech',
    description: 'Text-to-speech engine for synthesizing spoken output from text.',
    icon: Volume2,
    files: [
      { name: 'Kitten TTS', path: 'kittenTTS/mini.zip', size: 59540857 },
    ],
  },
  {
    id: 'embeddings',
    name: 'Embeddings',
    tag: 'Embedding',
    description: 'Dense vector embeddings for retrieval and similarity search.',
    icon: Binary,
    files: [
      { name: 'bge-base-en-v1.5-q8_0.gguf', path: 'bge-1.5-embed/bge-base-en-v1.5-q8_0.gguf', size: 117974304 },
      { name: 'bge-small-en-v1.5-q8_0.gguf', path: 'bge-1.5-embed/bge-small-en-v1.5-q8_0.gguf', size: 36685152 },
    ],
  },
  {
    id: 'classifier',
    name: 'Classifier',
    tag: 'Routing',
    description: 'Lightweight classifier that routes queries to the right pipeline path.',
    icon: Router,
    files: [
      {
        name: 'DistilBERT',
        path: 'distilBert-query-router/onnx_model/model.onnx',
        paths: [
          'distilBert-query-router/onnx_model/model.onnx',
          'distilBert-query-router/onnx_model/model.onnx.data',
          'distilBert-query-router/onnx_model/tokenizer.json',
          'distilBert-query-router/onnx_model/vocab.txt',
          'distilBert-query-router/onnx_model/config.json',
          'distilBert-query-router/onnx_model/tokenizer_config.json',
          'distilBert-query-router/onnx_model/special_tokens_map.json',
        ],
        size: 269595378,
      },
    ],
  },
  {
    id: 'grader',
    name: 'Grader',
    tag: 'Evaluation',
    description: 'Scores relevance and quality of retrieved context for better responses.',
    icon: Award,
    files: [
      {
        name: 'ms-marco-MiniLM-L6-v2-onnx-int8',
        path: 'grader/ms-marco-MiniLM-L6-v2-onnx-int8/model_quantized.onnx',
        paths: [
          'grader/ms-marco-MiniLM-L6-v2-onnx-int8/model_quantized.onnx',
          'grader/ms-marco-MiniLM-L6-v2-onnx-int8/tokenizer.json',
          'grader/ms-marco-MiniLM-L6-v2-onnx-int8/vocab.txt',
          'grader/ms-marco-MiniLM-L6-v2-onnx-int8/config.json',
          'grader/ms-marco-MiniLM-L6-v2-onnx-int8/ort_config.json',
          'grader/ms-marco-MiniLM-L6-v2-onnx-int8/special_tokens_map.json',
        ],
        size: 23791028,
      },
    ],
  },
];

function CategoryCard({ category, index }: { category: ModelCategory; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = category.icon;
  const totalSize = category.files.reduce((sum, f) => sum + f.size, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
    >
      {/* Header — clickable */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between rounded-2xl border backdrop-blur-sm px-6 py-5 text-left transition-all duration-200 cursor-pointer"
        style={{
          background: expanded ? 'var(--bg-card-hover)' : 'var(--bg-card)',
          borderColor: expanded ? 'var(--accent)' : 'var(--border-subtle)',
          borderBottomLeftRadius: expanded ? 0 : undefined,
          borderBottomRightRadius: expanded ? 0 : undefined,
        }}
      >
        <div className="flex items-center gap-5">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--accent-glow)' }}
          >
            <Icon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className="font-space text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                {category.name}
              </span>
              <span
                className="font-mono text-xs px-2 py-0.5 rounded-md border"
                style={{
                  color: 'var(--accent)',
                  borderColor: 'var(--accent)',
                  background: 'var(--accent-glow)',
                }}
              >
                {category.tag}
              </span>
            </div>
            <p className="text-sm font-light mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {category.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 ml-4">
          <div className="hidden sm:block text-right">
            <div className="font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {category.files.length} file{category.files.length !== 1 ? 's' : ''}
            </div>
            <div className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
              {formatBytes(totalSize)}
            </div>
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          </motion.div>
        </div>
      </button>

      {/* Expanded file list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden rounded-b-2xl border border-t-0"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--accent)',
            }}
          >
            <div className="p-4 space-y-2">
              {category.files.map((file, i) => (
                <FileRow key={file.path} file={file} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function triggerMultiDownload(paths: string[]) {
  paths.forEach((p, i) => {
    setTimeout(() => {
      const a = document.createElement('a');
      a.href = `/api/models/download?file=${encodeURIComponent(p)}`;
      a.download = '';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }, i * 500);
  });
}

function FileRow({ file, index }: { file: ModelFile; index: number }) {
  const [hovered, setHovered] = useState(false);

  const handleDownload = () => {
    if (file.paths && file.paths.length > 1) {
      triggerMultiDownload(file.paths);
    } else {
      window.location.assign(`/api/models/download?file=${encodeURIComponent(file.path)}`);
    }
  };

  return (
    <motion.button
      onClick={handleDownload}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="group relative w-full flex items-center justify-between rounded-xl border backdrop-blur-sm px-5 py-3.5 text-left overflow-hidden"
      style={{
        background: hovered ? 'var(--bg-card-hover)' : 'transparent',
        borderColor: hovered ? 'var(--border-primary)' : 'var(--border-subtle)',
        transition: 'background 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* Left accent bar */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
        style={{ background: 'var(--accent)' }}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: hovered ? 1 : 0, opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />

      <div className="pl-1">
        <span
          className="font-mono text-sm font-semibold transition-colors duration-200"
          style={{ color: hovered ? 'var(--accent)' : 'var(--text-primary)' }}
        >
          {file.name}
        </span>
        <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          {formatBytes(file.size)}{file.paths && file.paths.length > 1 ? ` · ${file.paths.length} files` : ''}
        </p>
      </div>

      <motion.div
        animate={{ y: hovered ? 2 : 0, opacity: hovered ? 1 : 0.5 }}
        transition={{ duration: 0.2 }}
        className="shrink-0 ml-4"
      >
        <Download
          className="w-4 h-4"
          style={{ color: hovered ? 'var(--accent)' : 'var(--text-muted)' }}
        />
      </motion.div>
    </motion.button>
  );
}

export default function DownloadModels() {
  return (
    <div className="space-y-3">
      {categories.map((cat, i) => (
        <CategoryCard key={cat.id} category={cat} index={i} />
      ))}
    </div>
  );
}
