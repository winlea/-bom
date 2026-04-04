import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    luckysheet: any;
  }
}

function loadCss(href: string) {
  return new Promise<void>((resolve, reject) => {
    const exists = document.querySelector(`link[href="${href}"]`);
    if (exists) return resolve();
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Load CSS failed: ${href}`));
    document.head.appendChild(link);
  });
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const exists = document.querySelector(`script[src="${src}"]`);
    if (exists) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Load Script failed: ${src}`));
    document.body.appendChild(s);
  });
}

async function ensureLuckysheet() {
  const base = 'https://cdn.jsdelivr.net/npm/luckysheet@latest/dist';
  await loadCss(`${base}/plugins/css/plugins.css`);
  await loadCss(`${base}/plugins/plugins.css`);
  await loadCss(`${base}/css/luckysheet.css`);
  await loadCss(`${base}/assets/iconfont/iconfont.css`);
  await loadScript(`${base}/plugins/js/plugin.js`);
  await loadScript(`${base}/luckysheet.umd.js`);
}

const placeholders = [
  '${PROJECT_NAME}',
  '${CUSTOMER_NAME}',
  '${PRODUCT_NAME}',
  '${PRODUCT_NO}',
  '${SIZE_NO}',
  '${DRAW_DIM}',
];

const DesignerPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [sheetInited, setSheetInited] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await ensureLuckysheet();
        if (!mounted) return;
        setReady(true);
      } catch (e) {
        console.error(e);
        alert('加载 Luckysheet 失败，请检查网络或稍后重试。');
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current || sheetInited) return;
    const el = containerRef.current;
    // 初始化 Luckysheet
    const height = window.innerHeight - 140;
    window.luckysheet.create({
      container: el.id,
      lang: 'zh',
      showinfobar: true,
      showsheetbar: true,
      showstatisticBar: true,
      showtoolbar: true,
      allowCopy: true,
      data: [
        {
          name: 'Sheet1',
          index: 0,
          row: 80,
          column: 40,
          config: {
            columnlen: { '0': 120, '1': 280, '2': 160, '3': 160 },
            // 默认行高/列宽可在这里调整
          },
        },
      ],
      hook: {
        // 可根据需要增加钩子
      },
    });
    setSheetInited(true);
    const onResize = () => {
      // 简单自适应
      const container = document.getElementById(el.id);
      if (container) {
        container.style.height = `${window.innerHeight - 140}px`;
      }
    };
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, [ready, sheetInited]);

  function getPrimarySelection() {
    try {
      const range = window.luckysheet.getRange();
      if (range && range.length > 0) {
        const r0 = range[0].row[0];
        const c0 = range[0].column[0];
        const sheet = window.luckysheet.getSheet();
        const index = sheet?.index ?? 0;
        return { r: r0, c: c0, index };
      }
    } catch (e) {
      console.warn('getRange not available, fallback to A1');
    }
    return { r: 0, c: 0, index: 0 };
  }

  function insertPlaceholder(ph: string) {
    const sel = getPrimarySelection();
    try {
      // 写入占位符文本，左对齐 + 自动换行，避免“只显示一半”
      window.luckysheet.setCellValue(sel.r, sel.c, ph, { index: sel.index, isRefresh: true });
      window.luckysheet.setRangeStyle(
        {
          // wrap text
          tb: 2, // 2=换行
          vt: '2', // middle
          ht: '1', // left
        },
        { range: [{ row: [sel.r, sel.r], column: [sel.c, sel.c] }], index: sel.index }
      );
    } catch (e) {
      console.error(e);
      alert('插入失败，请选中一个单元格后重试。');
    }
  }

  function exportJson() {
    try {
      const data = window.luckysheet.getLuckysheetfile();
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `designer_template_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      console.error(e);
      alert('导出失败');
    }
  }

  function importJson(files: FileList | null) {
    if (!files || files.length === 0) return;
    const f = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(String(reader.result));
        // 重新创建
        const el = containerRef.current;
        if (!el) return;
        el.innerHTML = ''; // 清空
        window.luckysheet.destroy();
        window.luckysheet.create({
          container: el.id,
          lang: 'zh',
          showtoolbar: true,
          showinfobar: true,
          showsheetbar: true,
          data: json,
        });
      } catch (e) {
        console.error(e);
        alert('导入失败：文件不是有效的模板 JSON');
      }
    };
    reader.readAsText(f);
  }

  return (
    <div className="mx-auto max-w-[1600px] p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-lg font-semibold">ODS 模板设计器（Luckysheet）</span>
        <span className="text-sm text-gray-500">插入占位符时默认左对齐并换行，避免字段过长只显示一半。</span>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {placeholders.map((p) => (
          <button
            key={p}
            onClick={() => insertPlaceholder(p)}
            className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 text-sm"
            title="将占位符写入当前选中单元格"
          >
            插入 {p}
          </button>
        ))}
        <div className="ml-4 flex items-center gap-2">
          <button onClick={exportJson} className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm">
            导出模板JSON
          </button>
          <label className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 text-sm cursor-pointer">
            导入模板JSON
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => importJson(e.target.files)}
            />
          </label>
        </div>
      </div>
      <div
        id="luckysheet-container"
        ref={containerRef}
        style={{ height: '70vh', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}
      />
    </div>
  );
};

export default DesignerPage;
