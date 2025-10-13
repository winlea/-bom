// 修复前端去重逻辑，使其符合用户要求：序号和零件号同时重复才算重复数据

// 读取原始文件
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'bom-redesign', 'bom-system-redesign', 'src', 'pages', 'parts.tsx');

// 读取文件内容
const content = fs.readFileSync(filePath, 'utf8');

// 查找并替换去重逻辑
const oldDedupLogic = `  // 1. 去重：只根据零件号去重，保留第一个出现的项
    const uniqueParts = parts.filter((part, index, self) => {
      const partNumber = String(part.part_number || (part as any).产品编号 || '').trim();
      
      // 检查是否有相同零件号的项已经在列表中
      const firstIndex = self.findIndex(p => {
        const pNumber = String(p.part_number || (p as any).产品编号 || '').trim();
        return pNumber === partNumber;
      });
      
      // 只保留第一次出现的项
      return firstIndex === index;
    });`;

const newDedupLogic = `  // 1. 去重：根据序号和零件号组合去重，保留第一个出现的项
    const uniqueParts = parts.filter((part, index, self) => {
      const partNumber = String(part.part_number || (part as any).产品编号 || '').trim();
      const sequence = String(part.sequence || (part as any).序号 || '').trim();
      
      // 检查是否有相同序号和零件号组合的项已经在列表中
      const firstIndex = self.findIndex(p => {
        const pNumber = String(p.part_number || (p as any).产品编号 || '').trim();
        const pSequence = String(p.sequence || (p as any).序号 || '').trim();
        return pNumber === partNumber && pSequence === sequence;
      });
      
      // 只保留第一次出现的项
      return firstIndex === index;
    });`;

// 替换去重逻辑
const updatedContent = content.replace(oldDedupLogic, newDedupLogic);

// 写回文件
fs.writeFileSync(filePath, updatedContent, 'utf8');

console.log('已更新前端去重逻辑，现在只有序号和零件号同时重复才会被视为重复数据');