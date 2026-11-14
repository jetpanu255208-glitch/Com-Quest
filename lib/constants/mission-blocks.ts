export type BlockCategory =
  | 'events'
  | 'structure'
  | 'text'
  | 'format'
  | 'media'
  | 'form';

export type BlockShape = 'hat' | 'stack' | 'c-block';

export interface BlockSlotOption {
  label: string;
  value: string;
}

export interface BlockSlot {
  id: string;
  type: 'text' | 'select';
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  defaultValue: string;
  options?: BlockSlotOption[];
}

export interface BlockSegment {
  type: 'label' | 'slot';
  text?: string;
  slotId?: string;
}

export interface BlockTemplate {
  typeId: string;
  category: BlockCategory;
  shape: BlockShape;
  tagBadge: string;
  title: string;
  closingTagLabel?: string;
  dropZoneHint?: string;
  preferredParentTypes?: string[];
  slots: BlockSlot[];
  segments: BlockSegment[];
  renderHtml: (slots: Record<string, string>, childrenHtml: string) => string;
}

export interface WorkspaceBlock {
  instanceId: string;
  typeId: string;
  slotValues: Record<string, string>;
  children: WorkspaceBlock[];
}

export interface MissionStepGuide {
  stepNumber: number;
  title: string;
  instruction: string;
  recommendedBlockIds: string[];
  criteriaId?: string;
}

export interface LessonBlockConfig {
  lessonId: string;
  templates: BlockTemplate[];
  initialWorkspace: WorkspaceBlock[];
  solutionWorkspace: WorkspaceBlock[];
  steps: MissionStepGuide[];
}

export const BLOCK_CATEGORIES: {
  id: BlockCategory;
  label: string;
  thaiLabel: string;
  colorHex: string;
  bgClass: string;
  borderClass: string;
  darkBgClass: string;
}[] = [
  {
    id: 'events',
    label: 'EVENTS',
    thaiLabel: 'จุดเริ่มต้น',
    colorHex: '#f59e0b',
    bgClass: 'bg-amber-500',
    borderClass: 'border-amber-600',
    darkBgClass: 'bg-amber-600',
  },
  {
    id: 'structure',
    label: 'STRUCTURE',
    thaiLabel: 'โครงสร้าง',
    colorHex: '#f97316',
    bgClass: 'bg-orange-500',
    borderClass: 'border-orange-600',
    darkBgClass: 'bg-orange-600',
  },
  {
    id: 'text',
    label: 'TEXT',
    thaiLabel: 'ข้อความ',
    colorHex: '#0284c7',
    bgClass: 'bg-sky-600',
    borderClass: 'border-sky-700',
    darkBgClass: 'bg-sky-700',
  },
  {
    id: 'format',
    label: 'FORMAT',
    thaiLabel: 'เน้นคำ',
    colorHex: '#8b5cf6',
    bgClass: 'bg-violet-600',
    borderClass: 'border-violet-700',
    darkBgClass: 'bg-violet-700',
  },
  {
    id: 'media',
    label: 'MEDIA & LINK',
    thaiLabel: 'ลิงก์ & สื่อ',
    colorHex: '#10b981',
    bgClass: 'bg-emerald-600',
    borderClass: 'border-emerald-700',
    darkBgClass: 'bg-emerald-700',
  },
  {
    id: 'form',
    label: 'FORM',
    thaiLabel: 'แบบฟอร์ม',
    colorHex: '#f43f5e',
    bgClass: 'bg-rose-600',
    borderClass: 'border-rose-700',
    darkBgClass: 'bg-rose-700',
  },
];

let blockCounter = 100;
export function createBlockInstance(
  template: BlockTemplate,
  overrideSlots?: Record<string, string>,
  children: WorkspaceBlock[] = []
): WorkspaceBlock {
  blockCounter += 1;
  const defaultSlots: Record<string, string> = {};
  for (const s of template.slots) {
    defaultSlots[s.id] = overrideSlots?.[s.id] ?? s.defaultValue;
  }
  return {
    instanceId: `blk_${template.typeId}_${blockCounter}_${Math.random().toString(36).slice(2, 6)}`,
    typeId: template.typeId,
    slotValues: defaultSlots,
    children,
  };
}

export function cloneWorkspaceBlocks(blocks: WorkspaceBlock[]): WorkspaceBlock[] {
  return blocks.map((b) => ({
    instanceId: `blk_${b.typeId}_${++blockCounter}_${Math.random().toString(36).slice(2, 6)}`,
    typeId: b.typeId,
    slotValues: { ...b.slotValues },
    children: cloneWorkspaceBlocks(b.children),
  }));
}

export function compileBlocksToHtml(
  blocks: WorkspaceBlock[],
  templateMap: Record<string, BlockTemplate>,
  indentLevel = 0
): string {
  const indent = '  '.repeat(indentLevel);
  return blocks
    .map((block) => {
      const template = templateMap[block.typeId];
      if (!template) return '';
      const childrenHtml =
        block.children.length > 0
          ? '\n' +
            compileBlocksToHtml(block.children, templateMap, indentLevel + 1) +
            '\n' +
            indent
          : '';
      return indent + template.renderHtml(block.slotValues, childrenHtml);
    })
    .filter((line) => line.trim().length > 0)
    .join('\n');
}

// ============================================================================
// LESSON BLOCK CONFIGURATIONS (HTML_02 to HTML_08)
// ============================================================================

const LESSON_02_TEMPLATES: BlockTemplate[] = [
  {
    typeId: 'h_name',
    category: 'text',
    shape: 'stack',
    tagBadge: '<h1>',
    title: 'หัวเรื่องแสดงชื่อ-นามสกุล',
    slots: [
      {
        id: 'level',
        type: 'select',
        defaultValue: 'h1',
        options: [
          { label: 'h1 (ใหญ่สุด)', value: 'h1' },
          { label: 'h2 (รอง)', value: 'h2' },
          { label: 'h3 (ย่อย)', value: 'h3' },
        ],
      },
      {
        id: 'text',
        type: 'text',
        placeholder: 'พิมพ์ชื่อ-นามสกุลของคุณ',
        defaultValue: 'เด็กชายไอที คนเก่ง',
      },
    ],
    segments: [
      { type: 'label', text: 'สร้างหัวเรื่อง' },
      { type: 'slot', slotId: 'level' },
      { type: 'label', text: 'ชื่อ:' },
      { type: 'slot', slotId: 'text' },
    ],
    renderHtml: (s) => `<${s.level || 'h1'}>${s.text || ''}</${s.level || 'h1'}>`,
  },
  {
    typeId: 'p_student_id',
    category: 'text',
    shape: 'stack',
    tagBadge: '<p>',
    title: 'ย่อหน้ารหัสประจำตัวนักเรียน 11 หลัก',
    slots: [
      {
        id: 'studentId',
        type: 'text',
        placeholder: 'รหัส 11 หลัก เช่น 68219100010',
        defaultValue: '68219100010',
      },
    ],
    segments: [
      { type: 'label', text: 'ย่อหน้า <p> รหัสประจำตัว:' },
      { type: 'slot', slotId: 'studentId' },
      { type: 'label', text: '</p>' },
    ],
    renderHtml: (s) => `<p>รหัสประจำตัว: ${s.studentId || ''}</p>`,
  },
  {
    typeId: 'p_custom',
    category: 'text',
    shape: 'stack',
    tagBadge: '<p>',
    title: 'ย่อหน้าข้อความทั่วไป',
    slots: [
      {
        id: 'text',
        type: 'text',
        placeholder: 'ข้อความเพิ่มเติม...',
        defaultValue: 'นักเรียนกิลด์นักพัฒนาเว็บไซต์ Com Quest',
      },
    ],
    segments: [
      { type: 'label', text: 'ย่อหน้า <p>' },
      { type: 'slot', slotId: 'text' },
      { type: 'label', text: '</p>' },
    ],
    renderHtml: (s) => `<p>${s.text || ''}</p>`,
  },
  {
    typeId: 'br_line',
    category: 'structure',
    shape: 'stack',
    tagBadge: '<br>',
    title: 'ขึ้นบรรทัดใหม่ (<br>)',
    slots: [],
    segments: [{ type: 'label', text: 'ขึ้นบรรทัดใหม่ <br>' }],
    renderHtml: () => `<br>`,
  },
];

const LESSON_03_TEMPLATES: BlockTemplate[] = [
  {
    typeId: 'h2_announce',
    category: 'text',
    shape: 'stack',
    tagBadge: '<h2>',
    title: 'หัวข้อประกาศ',
    slots: [
      {
        id: 'text',
        type: 'text',
        defaultValue: 'ประกาศกิจกรรมวิชาคอมพิวเตอร์',
      },
    ],
    segments: [
      { type: 'label', text: 'หัวเรื่อง <h2>' },
      { type: 'slot', slotId: 'text' },
      { type: 'label', text: '</h2>' },
    ],
    renderHtml: (s) => `<h2>${s.text}</h2>`,
  },
  {
    typeId: 'p_container',
    category: 'structure',
    shape: 'c-block',
    tagBadge: '<p>',
    title: 'กล่องย่อหน้า <p> (ครอบข้อความเน้นคำ)',
    closingTagLabel: 'ปิดย่อหน้า </p>',
    dropZoneHint: 'ลากบล็อกตัวหนา <strong>, ตัวเอียง <em>, ไฮไลต์ <mark> มาใส่ในนี้',
    slots: [],
    segments: [{ type: 'label', text: 'เปิดย่อหน้า <p>' }],
    renderHtml: (_, childrenHtml) => `<p>${childrenHtml || ''}</p>`,
  },
  {
    typeId: 'strong_block',
    category: 'format',
    shape: 'stack',
    tagBadge: '<strong>',
    title: 'ข้อความตัวหนาเน้นความสำคัญ',
    preferredParentTypes: ['p_container'],
    slots: [
      {
        id: 'tag',
        type: 'select',
        defaultValue: 'strong',
        options: [
          { label: '<strong> (สำคัญมาก)', value: 'strong' },
          { label: '<b> (ตัวหนา)', value: 'b' },
        ],
      },
      {
        id: 'text',
        type: 'text',
        defaultValue: 'คำเตือน:',
      },
    ],
    segments: [
      { type: 'label', text: 'ตัวหนา' },
      { type: 'slot', slotId: 'tag' },
      { type: 'slot', slotId: 'text' },
    ],
    renderHtml: (s) => `<${s.tag}>${s.text}</${s.tag}>`,
  },
  {
    typeId: 'em_block',
    category: 'format',
    shape: 'stack',
    tagBadge: '<em>',
    title: 'ข้อความตัวเอียงเน้นคำศัพท์',
    preferredParentTypes: ['p_container'],
    slots: [
      {
        id: 'tag',
        type: 'select',
        defaultValue: 'em',
        options: [
          { label: '<em> (เน้นเสียง)', value: 'em' },
          { label: '<i> (ตัวเอียง)', value: 'i' },
        ],
      },
      {
        id: 'text',
        type: 'text',
        defaultValue: 'ภาษา HTML เบื้องต้น',
      },
    ],
    segments: [
      { type: 'label', text: 'ตัวเอียง' },
      { type: 'slot', slotId: 'tag' },
      { type: 'label', text: 'นักเรียนทุกคนต้องฝึก' },
      { type: 'slot', slotId: 'text' },
    ],
    renderHtml: (s) => `นักเรียนทุกคนต้องฝึก <${s.tag}>${s.text}</${s.tag}>`,
  },
  {
    typeId: 'mark_block',
    category: 'format',
    shape: 'stack',
    tagBadge: '<mark>',
    title: 'แถบสีไฮไลต์ข้อความสำคัญ',
    preferredParentTypes: ['p_container'],
    slots: [
      {
        id: 'text',
        type: 'text',
        defaultValue: 'ภายในวันศุกร์นี้',
      },
    ],
    segments: [
      { type: 'label', text: 'ไฮไลต์ <mark> และส่งงาน' },
      { type: 'slot', slotId: 'text' },
      { type: 'label', text: '</mark>' },
    ],
    renderHtml: (s) => `และส่งงาน <mark>${s.text}</mark>`,
  },
];

const LESSON_04_TEMPLATES: BlockTemplate[] = [
  {
    typeId: 'h3_links',
    category: 'text',
    shape: 'stack',
    tagBadge: '<h3>',
    title: 'หัวข้อศูนย์รวมลิงก์',
    slots: [
      {
        id: 'text',
        type: 'text',
        defaultValue: 'ศูนย์รวมการเชื่อมโยงเว็บไซต์',
      },
    ],
    segments: [
      { type: 'label', text: 'หัวเรื่อง <h3>' },
      { type: 'slot', slotId: 'text' },
      { type: 'label', text: '</h3>' },
    ],
    renderHtml: (s) => `<h3>${s.text}</h3>`,
  },
  {
    typeId: 'a_external',
    category: 'media',
    shape: 'stack',
    tagBadge: '<a> นอกเว็บ',
    title: 'ลิงก์ภายนอก (Absolute URL + เปิดแท็บใหม่)',
    slots: [
      {
        id: 'href',
        type: 'select',
        defaultValue: 'https://www.google.com',
        options: [
          { label: 'https://www.google.com', value: 'https://www.google.com' },
          { label: 'https://www.wikipedia.org', value: 'https://www.wikipedia.org' },
          { label: 'https://developer.mozilla.org', value: 'https://developer.mozilla.org' },
        ],
      },
      {
        id: 'target',
        type: 'select',
        defaultValue: '_blank',
        options: [
          { label: '_blank (เปิดแท็บใหม่)', value: '_blank' },
          { label: '_self (หน้าเดิม)', value: '_self' },
        ],
      },
      {
        id: 'label',
        type: 'text',
        defaultValue: 'ไปยัง Google',
      },
    ],
    segments: [
      { type: 'label', text: 'ลิงก์ <a href=' },
      { type: 'slot', slotId: 'href' },
      { type: 'label', text: 'target=' },
      { type: 'slot', slotId: 'target' },
      { type: 'label', text: '> ข้อความ:' },
      { type: 'slot', slotId: 'label' },
    ],
    renderHtml: (s) => `<p>ค้นหาข้อมูล: <a href="${s.href}" target="${s.target}">${s.label}</a></p>`,
  },
  {
    typeId: 'a_internal',
    category: 'media',
    shape: 'stack',
    tagBadge: '<a> ในเว็บ',
    title: 'ลิงก์ภายในเว็บไซต์ (Relative URL)',
    slots: [
      {
        id: 'href',
        type: 'select',
        defaultValue: 'about.html',
        options: [
          { label: 'about.html', value: 'about.html' },
          { label: 'contact.html', value: 'contact.html' },
          { label: 'index.html', value: 'index.html' },
        ],
      },
      {
        id: 'label',
        type: 'text',
        defaultValue: 'ข้อมูลเกี่ยวกับเรา',
      },
    ],
    segments: [
      { type: 'label', text: 'ลิงก์ภายใน <a href=' },
      { type: 'slot', slotId: 'href' },
      { type: 'label', text: '> ข้อความ:' },
      { type: 'slot', slotId: 'label' },
    ],
    renderHtml: (s) => `<p>หน้าภายใน: <a href="${s.href}">${s.label}</a></p>`,
  },
];

const LESSON_05_TEMPLATES: BlockTemplate[] = [
  {
    typeId: 'h2_gallery',
    category: 'text',
    shape: 'stack',
    tagBadge: '<h2>',
    title: 'หัวข้อแกลเลอรีรูปภาพ',
    slots: [
      {
        id: 'text',
        type: 'text',
        defaultValue: 'แกลเลอรีรูปภาพของฉัน',
      },
    ],
    segments: [
      { type: 'label', text: 'หัวเรื่อง <h2>' },
      { type: 'slot', slotId: 'text' },
      { type: 'label', text: '</h2>' },
    ],
    renderHtml: (s) => `<h2>${s.text}</h2>`,
  },
  {
    typeId: 'img_full',
    category: 'media',
    shape: 'stack',
    tagBadge: '<img>',
    title: 'แทรกรูปภาพพร้อมกำหนด src, alt และขนาด width',
    slots: [
      {
        id: 'src',
        type: 'select',
        defaultValue: 'photo.jpg',
        options: [
          { label: 'photo.jpg (ภาพวิวธรรมชาติ)', value: 'photo.jpg' },
          { label: 'cyber-room.png (ห้องเกมเรโทร)', value: '/images/retro-room-1.png' },
          { label: 'cartridge.png (ตลับเกม HTML)', value: '/images/retro-cassette-cartridge.png' },
        ],
      },
      {
        id: 'alt',
        type: 'text',
        placeholder: 'คำอธิบายภาพ (alt)',
        defaultValue: 'รูปภาพวิวธรรมชาติแสนสวย',
      },
      {
        id: 'width',
        type: 'select',
        defaultValue: '300',
        options: [
          { label: '300 px (มาตรฐาน)', value: '300' },
          { label: '240 px (ขนาดเล็ก)', value: '240' },
          { label: '400 px (ขนาดใหญ่)', value: '400' },
        ],
      },
    ],
    segments: [
      { type: 'label', text: '<img src=' },
      { type: 'slot', slotId: 'src' },
      { type: 'label', text: 'alt=' },
      { type: 'slot', slotId: 'alt' },
      { type: 'label', text: 'width=' },
      { type: 'slot', slotId: 'width' },
      { type: 'label', text: '>' },
    ],
    renderHtml: (s) => `<img src="${s.src}" alt="${s.alt}" width="${s.width}">`,
  },
  {
    typeId: 'p_img_caption',
    category: 'text',
    shape: 'stack',
    tagBadge: '<p>',
    title: 'คำบรรยายใต้ภาพ',
    slots: [
      {
        id: 'text',
        type: 'text',
        defaultValue: 'ภาพประกอบบทเรียนการแทรกสื่อใน HTML5',
      },
    ],
    segments: [
      { type: 'label', text: 'ย่อหน้าคำบรรยาย <p>' },
      { type: 'slot', slotId: 'text' },
      { type: 'label', text: '</p>' },
    ],
    renderHtml: (s) => `<p>${s.text}</p>`,
  },
];

const LESSON_06_TEMPLATES: BlockTemplate[] = [
  {
    typeId: 'h3_table_title',
    category: 'text',
    shape: 'stack',
    tagBadge: '<h3>',
    title: 'หัวข้อสรุปข้อมูล',
    slots: [
      {
        id: 'text',
        type: 'text',
        defaultValue: 'สรุปข้อมูลคะแนนกิจกรรม',
      },
    ],
    segments: [
      { type: 'label', text: 'หัวเรื่อง <h3>' },
      { type: 'slot', slotId: 'text' },
      { type: 'label', text: '</h3>' },
    ],
    renderHtml: (s) => `<h3>${s.text}</h3>`,
  },
  {
    typeId: 'list_container',
    category: 'structure',
    shape: 'c-block',
    tagBadge: '<ul> / <ol>',
    title: 'กล่องรายการ (ครอบ <li> อย่างน้อย 2 ข้อ)',
    closingTagLabel: 'ปิดรายการ </ul>',
    dropZoneHint: 'ลากบล็อกหัวข้อย่อย <li> มาวางด้านในนี้ (อย่างน้อย 2 บล็อก)',
    slots: [
      {
        id: 'listType',
        type: 'select',
        defaultValue: 'ul',
        options: [
          { label: '<ul> จุดสัญลักษณ์', value: 'ul' },
          { label: '<ol> ตัวเลขลำดับ', value: 'ol' },
        ],
      },
    ],
    segments: [
      { type: 'label', text: 'สร้างรายการ' },
      { type: 'slot', slotId: 'listType' },
    ],
    renderHtml: (s, childrenHtml) =>
      `<${s.listType || 'ul'}>${childrenHtml || ''}</${s.listType || 'ul'}>`,
  },
  {
    typeId: 'li_item_1',
    category: 'text',
    shape: 'stack',
    tagBadge: '<li> #1',
    title: 'รายการย่อยที่ 1 (<li>)',
    preferredParentTypes: ['list_container'],
    slots: [
      {
        id: 'text',
        type: 'text',
        defaultValue: 'วิชาการเขียนภาษา HTML เบื้องต้น',
      },
    ],
    segments: [
      { type: 'label', text: 'หัวข้อย่อย <li>' },
      { type: 'slot', slotId: 'text' },
      { type: 'label', text: '</li>' },
    ],
    renderHtml: (s) => `<li>${s.text}</li>`,
  },
  {
    typeId: 'li_item_2',
    category: 'text',
    shape: 'stack',
    tagBadge: '<li> #2',
    title: 'รายการย่อยที่ 2 (<li>)',
    preferredParentTypes: ['list_container'],
    slots: [
      {
        id: 'text',
        type: 'text',
        defaultValue: 'การทดสอบความรู้ท้ายบทเรียน',
      },
    ],
    segments: [
      { type: 'label', text: 'หัวข้อย่อย <li>' },
      { type: 'slot', slotId: 'text' },
      { type: 'label', text: '</li>' },
    ],
    renderHtml: (s) => `<li>${s.text}</li>`,
  },
  {
    typeId: 'table_container',
    category: 'structure',
    shape: 'c-block',
    tagBadge: '<table>',
    title: 'โครงสร้างตาราง <table> (ครอบแถว <tr>)',
    closingTagLabel: 'ปิดตาราง </table>',
    dropZoneHint: 'ลากบล็อกแถวหัวตาราง <tr>(th) และแถวข้อมูล <tr>(td) มาใส่ในนี้',
    slots: [
      {
        id: 'border',
        type: 'select',
        defaultValue: '1',
        options: [
          { label: 'border="1" (มีเส้นขอบ)', value: '1' },
          { label: 'border="2" (ขอบหนา)', value: '2' },
        ],
      },
    ],
    segments: [
      { type: 'label', text: 'เปิดตาราง <table' },
      { type: 'slot', slotId: 'border' },
      { type: 'label', text: '>' },
    ],
    renderHtml: (s, childrenHtml) =>
      `<table border="${s.border || '1'}">${childrenHtml || ''}</table>`,
  },
  {
    typeId: 'tr_header_row',
    category: 'text',
    shape: 'stack',
    tagBadge: '<tr> + <th>',
    title: 'แถวหัวข้อตาราง (<tr> พร้อมช่อง <th>)',
    preferredParentTypes: ['table_container'],
    slots: [
      {
        id: 'col1',
        type: 'text',
        defaultValue: 'ชื่อผู้เรียน',
      },
      {
        id: 'col2',
        type: 'text',
        defaultValue: 'คะแนน',
      },
    ],
    segments: [
      { type: 'label', text: 'แถวหัวตาราง <tr> <th>' },
      { type: 'slot', slotId: 'col1' },
      { type: 'label', text: '</th> <th>' },
      { type: 'slot', slotId: 'col2' },
      { type: 'label', text: '</th> </tr>' },
    ],
    renderHtml: (s) => `<tr>\n    <th>${s.col1}</th>\n    <th>${s.col2}</th>\n  </tr>`,
  },
  {
    typeId: 'tr_data_row',
    category: 'text',
    shape: 'stack',
    tagBadge: '<tr> + <td>',
    title: 'แถวข้อมูลตาราง (<tr> พร้อมช่อง <td>)',
    preferredParentTypes: ['table_container'],
    slots: [
      {
        id: 'val1',
        type: 'text',
        defaultValue: 'สมชาย',
      },
      {
        id: 'val2',
        type: 'text',
        defaultValue: '95',
      },
    ],
    segments: [
      { type: 'label', text: 'แถวข้อมูล <tr> <td>' },
      { type: 'slot', slotId: 'val1' },
      { type: 'label', text: '</td> <td>' },
      { type: 'slot', slotId: 'val2' },
      { type: 'label', text: '</td> </tr>' },
    ],
    renderHtml: (s) => `<tr>\n    <td>${s.val1}</td>\n    <td>${s.val2}</td>\n  </tr>`,
  },
];

const LESSON_07_TEMPLATES: BlockTemplate[] = [
  {
    typeId: 'h3_form_title',
    category: 'text',
    shape: 'stack',
    tagBadge: '<h3>',
    title: 'หัวข้อแบบฟอร์มลงทะเบียน',
    slots: [
      {
        id: 'text',
        type: 'text',
        defaultValue: 'แบบฟอร์มลงทะเบียนกิลด์ Com Quest',
      },
    ],
    segments: [
      { type: 'label', text: 'หัวเรื่อง <h3>' },
      { type: 'slot', slotId: 'text' },
      { type: 'label', text: '</h3>' },
    ],
    renderHtml: (s) => `<h3>${s.text}</h3>`,
  },
  {
    typeId: 'form_container',
    category: 'structure',
    shape: 'c-block',
    tagBadge: '<form>',
    title: 'กล่องแบบฟอร์ม <form> (ครอบช่องกรอกและปุ่ม)',
    closingTagLabel: 'ปิดแบบฟอร์ม </form>',
    dropZoneHint: 'ลากบล็อก <label>, <input> และ <button> มาใส่ภายในฟอร์มนี้',
    slots: [
      {
        id: 'method',
        type: 'select',
        defaultValue: 'POST',
        options: [
          { label: 'method="POST"', value: 'POST' },
          { label: 'method="GET"', value: 'GET' },
        ],
      },
    ],
    segments: [
      { type: 'label', text: 'เปิดแบบฟอร์ม <form action="/register"' },
      { type: 'slot', slotId: 'method' },
      { type: 'label', text: '>' },
    ],
    renderHtml: (s, childrenHtml) =>
      `<form action="/register" method="${s.method || 'POST'}">${childrenHtml || ''}</form>`,
  },
  {
    typeId: 'label_field',
    category: 'form',
    shape: 'stack',
    tagBadge: '<label>',
    title: 'ป้ายกำกับชื่อช่องข้อมูล (<label>)',
    preferredParentTypes: ['form_container'],
    slots: [
      {
        id: 'text',
        type: 'text',
        defaultValue: 'ชื่อผู้ใช้:',
      },
    ],
    segments: [
      { type: 'label', text: 'ป้ายกำกับ <label>' },
      { type: 'slot', slotId: 'text' },
      { type: 'label', text: '</label>' },
    ],
    renderHtml: (s) => `<label>${s.text}</label>`,
  },
  {
    typeId: 'input_text_field',
    category: 'form',
    shape: 'stack',
    tagBadge: '<input text>',
    title: 'ช่องกรอกข้อความ (<input type="text">)',
    preferredParentTypes: ['form_container'],
    slots: [
      {
        id: 'placeholder',
        type: 'text',
        defaultValue: 'กรอกชื่อผู้ใช้',
      },
    ],
    segments: [
      { type: 'label', text: '<input type="text" placeholder=' },
      { type: 'slot', slotId: 'placeholder' },
      { type: 'label', text: 'required>' },
    ],
    renderHtml: (s) =>
      `<input type="text" name="username" placeholder="${s.placeholder}" required>`,
  },
  {
    typeId: 'input_email_field',
    category: 'form',
    shape: 'stack',
    tagBadge: '<input email>',
    title: 'ช่องกรอกอีเมล (<input type="email">)',
    preferredParentTypes: ['form_container'],
    slots: [
      {
        id: 'placeholder',
        type: 'text',
        defaultValue: 'example@mail.com',
      },
    ],
    segments: [
      { type: 'label', text: '<input type="email" placeholder=' },
      { type: 'slot', slotId: 'placeholder' },
      { type: 'label', text: 'required>' },
    ],
    renderHtml: (s) =>
      `<input type="email" name="email" placeholder="${s.placeholder}" required>`,
  },
  {
    typeId: 'button_submit',
    category: 'form',
    shape: 'stack',
    tagBadge: '<button>',
    title: 'ปุ่มกดส่งข้อมูล (<button type="submit">)',
    preferredParentTypes: ['form_container'],
    slots: [
      {
        id: 'label',
        type: 'text',
        defaultValue: 'ส่งข้อมูล',
      },
    ],
    segments: [
      { type: 'label', text: 'ปุ่ม <button type="submit">' },
      { type: 'slot', slotId: 'label' },
      { type: 'label', text: '</button>' },
    ],
    renderHtml: (s) => `<button type="submit">${s.label}</button>`,
  },
];

const LESSON_08_TEMPLATES: BlockTemplate[] = [
  {
    typeId: 'header_semantic',
    category: 'structure',
    shape: 'c-block',
    tagBadge: '<header>',
    title: 'ส่วนหัวของหน้าเว็บ (<header>)',
    closingTagLabel: 'ปิดส่วนหัว </header>',
    dropZoneHint: 'ลากบล็อกหัวเรื่อง <h1> มาวางด้านใน <header>',
    slots: [],
    segments: [{ type: 'label', text: 'ส่วนหัวเว็บ <header>' }],
    renderHtml: (_, childrenHtml) =>
      `<header>${childrenHtml || '\n  <h1>Com Quest Portal</h1>\n'}</header>`,
  },
  {
    typeId: 'h1_portal',
    category: 'text',
    shape: 'stack',
    tagBadge: '<h1>',
    title: 'หัวเรื่องหลักของเว็บ (<h1>)',
    preferredParentTypes: ['header_semantic'],
    slots: [
      {
        id: 'text',
        type: 'text',
        defaultValue: 'Com Quest Portal',
      },
    ],
    segments: [
      { type: 'label', text: 'หัวเรื่อง <h1>' },
      { type: 'slot', slotId: 'text' },
      { type: 'label', text: '</h1>' },
    ],
    renderHtml: (s) => `<h1>${s.text}</h1>`,
  },
  {
    typeId: 'nav_semantic',
    category: 'structure',
    shape: 'c-block',
    tagBadge: '<nav>',
    title: 'แถบเมนูนำทาง (<nav>)',
    closingTagLabel: 'ปิดเมนูนำทาง </nav>',
    dropZoneHint: 'ลากบล็อกลิงก์เมนู <a> อย่างน้อย 2 ลิงก์มาใส่ใน <nav>',
    slots: [],
    segments: [{ type: 'label', text: 'แถบเมนูนำทาง <nav>' }],
    renderHtml: (_, childrenHtml) => `<nav>${childrenHtml || ''}</nav>`,
  },
  {
    typeId: 'nav_link_1',
    category: 'media',
    shape: 'stack',
    tagBadge: '<a> เมนู 1',
    title: 'ลิงก์เมนูที่ 1 (<a>)',
    preferredParentTypes: ['nav_semantic'],
    slots: [
      {
        id: 'href',
        type: 'text',
        defaultValue: '#home',
      },
      {
        id: 'text',
        type: 'text',
        defaultValue: 'หน้าแรก',
      },
    ],
    segments: [
      { type: 'label', text: 'ลิงก์ <a href=' },
      { type: 'slot', slotId: 'href' },
      { type: 'label', text: '>' },
      { type: 'slot', slotId: 'text' },
      { type: 'label', text: '</a>' },
    ],
    renderHtml: (s) => `<a href="${s.href}">${s.text}</a>`,
  },
  {
    typeId: 'nav_link_2',
    category: 'media',
    shape: 'stack',
    tagBadge: '<a> เมนู 2',
    title: 'ลิงก์เมนูที่ 2 (<a>)',
    preferredParentTypes: ['nav_semantic'],
    slots: [
      {
        id: 'href',
        type: 'text',
        defaultValue: '#lessons',
      },
      {
        id: 'text',
        type: 'text',
        defaultValue: 'บทเรียน',
      },
    ],
    segments: [
      { type: 'label', text: 'ลิงก์ <a href=' },
      { type: 'slot', slotId: 'href' },
      { type: 'label', text: '>' },
      { type: 'slot', slotId: 'text' },
      { type: 'label', text: '</a>' },
    ],
    renderHtml: (s) => `<a href="${s.href}">${s.text}</a>`,
  },
  {
    typeId: 'main_semantic',
    category: 'structure',
    shape: 'c-block',
    tagBadge: '<main>',
    title: 'พื้นที่เนื้อหาหลัก (<main>)',
    closingTagLabel: 'ปิดเนื้อหาหลัก </main>',
    dropZoneHint: 'ลากบล็อก <section> หรือ <article> มาใส่ใน <main>',
    slots: [],
    segments: [{ type: 'label', text: 'เนื้อหาหลัก <main>' }],
    renderHtml: (_, childrenHtml) => `<main>${childrenHtml || ''}</main>`,
  },
  {
    typeId: 'section_semantic',
    category: 'structure',
    shape: 'stack',
    tagBadge: '<section>',
    title: 'ส่วนเนื้อหาย่อย (<section> / <article>)',
    preferredParentTypes: ['main_semantic'],
    slots: [
      {
        id: 'tag',
        type: 'select',
        defaultValue: 'section',
        options: [
          { label: '<section> (กลุ่มเนื้อหา)', value: 'section' },
          { label: '<article> (บทความ)', value: 'article' },
        ],
      },
      {
        id: 'heading',
        type: 'text',
        defaultValue: 'ยินดีต้อนรับสู่โลกของ HTML5',
      },
      {
        id: 'desc',
        type: 'text',
        defaultValue: 'เรียนรู้การสร้างโครงสร้างเว็บเชิงความหมายที่ถูกต้อง',
      },
    ],
    segments: [
      { type: 'label', text: 'กลุ่มเนื้อหา' },
      { type: 'slot', slotId: 'tag' },
      { type: 'label', text: 'หัวข้อ:' },
      { type: 'slot', slotId: 'heading' },
      { type: 'label', text: 'เนื้อหา:' },
      { type: 'slot', slotId: 'desc' },
    ],
    renderHtml: (s) =>
      `<${s.tag || 'section'}>\n    <h2>${s.heading}</h2>\n    <p>${s.desc}</p>\n  </${s.tag || 'section'}>`,
  },
  {
    typeId: 'footer_semantic',
    category: 'structure',
    shape: 'stack',
    tagBadge: '<footer>',
    title: 'ส่วนท้ายหน้าเว็บ (<footer>)',
    slots: [
      {
        id: 'text',
        type: 'text',
        defaultValue: '© 2026 Com Quest. All rights reserved.',
      },
    ],
    segments: [
      { type: 'label', text: 'ส่วนท้ายเว็บ <footer>' },
      { type: 'slot', slotId: 'text' },
      { type: 'label', text: '</footer>' },
    ],
    renderHtml: (s) => `<footer>\n  <p>${s.text}</p>\n</footer>`,
  },
];

export const LESSON_BLOCK_CONFIGS: Record<string, LessonBlockConfig> = {
  html_02: {
    lessonId: 'html_02',
    templates: LESSON_02_TEMPLATES,
    initialWorkspace: [],
    solutionWorkspace: [
      createBlockInstance(LESSON_02_TEMPLATES[0]),
      createBlockInstance(LESSON_02_TEMPLATES[1]),
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'วางบล็อกหัวเรื่องชื่อของคุณ (<h1>)',
        instruction: 'คลิกหรือลากบล็อก "สร้างหัวเรื่อง <h1>" จากคลังฝั่งซ้าย มาต่อใต้บล็อกจุดเริ่มต้น แล้วพิมพ์ชื่อ-นามสกุลในช่องสีขาว',
        recommendedBlockIds: ['h_name'],
        criteriaId: 'student-name',
      },
      {
        stepNumber: 2,
        title: 'วางบล็อกรหัสประจำตัวนักเรียน 11 หลัก (<p>)',
        instruction: 'คลิกหรือลากบล็อก "ย่อหน้า <p> รหัสประจำตัว" มาต่อด้านล่าง แล้วกรอกตัวเลขรหัสนักเรียนให้ครบ 11 หลัก',
        recommendedBlockIds: ['p_student_id'],
        criteriaId: 'student-id-11-digits',
      },
      {
        stepNumber: 3,
        title: 'กดปุ่ม ▶ Play เพื่อรันแสดงผลบัตรนักเรียน',
        instruction: 'เมื่อต่อบล็อกครบแล้ว กดปุ่มสีเขียว ▶ มุมขวาล่างเพื่อรันโค้ดและตรวจผลลัพธ์!',
        recommendedBlockIds: [],
        criteriaId: 'html-tags',
      },
    ],
  },

  html_03: {
    lessonId: 'html_03',
    templates: LESSON_03_TEMPLATES,
    initialWorkspace: [createBlockInstance(LESSON_03_TEMPLATES[0])],
    solutionWorkspace: [
      createBlockInstance(LESSON_03_TEMPLATES[0]),
      createBlockInstance(LESSON_03_TEMPLATES[1], undefined, [
        createBlockInstance(LESSON_03_TEMPLATES[2]),
        createBlockInstance(LESSON_03_TEMPLATES[3]),
        createBlockInstance(LESSON_03_TEMPLATES[4]),
      ]),
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'วางกล่องย่อหน้า <p> และบล็อกตัวหนา <strong>',
        instruction: 'นำบล็อก "เปิดย่อหน้า <p>" มาวาง แล้วใส่บล็อก "ตัวหนา <strong>" เข้าไปด้านใน',
        recommendedBlockIds: ['p_container', 'strong_block'],
        criteriaId: 'bold-tag',
      },
      {
        stepNumber: 2,
        title: 'ใส่บล็อกตัวเอียง <em> เน้นคำศัพท์',
        instruction: 'คลิกหรือลากบล็อก "ตัวเอียง <em>" เข้าไปต่อในย่อหน้าเดียวกัน',
        recommendedBlockIds: ['em_block'],
        criteriaId: 'italic-tag',
      },
      {
        stepNumber: 3,
        title: 'ใส่บล็อกไฮไลต์ <mark> แล้วกด ▶ Play',
        instruction: 'นำบล็อก "ไฮไลต์ <mark>" มาต่อท้ายเพื่อเน้นกำหนดส่งงาน จากนั้นกดปุ่ม ▶ Play',
        recommendedBlockIds: ['mark_block'],
        criteriaId: 'mark-tag',
      },
    ],
  },

  html_04: {
    lessonId: 'html_04',
    templates: LESSON_04_TEMPLATES,
    initialWorkspace: [createBlockInstance(LESSON_04_TEMPLATES[0])],
    solutionWorkspace: [
      createBlockInstance(LESSON_04_TEMPLATES[0]),
      createBlockInstance(LESSON_04_TEMPLATES[1]),
      createBlockInstance(LESSON_04_TEMPLATES[2]),
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'วางบล็อกลิงก์ภายนอก (https:// + target="_blank")',
        instruction: 'คลิกหรือลากบล็อก "<a> นอกเว็บ" มาต่อ พร้อมตรวจสอบว่าเลือก target เป็น _blank เพื่อเปิดแท็บใหม่',
        recommendedBlockIds: ['a_external'],
        criteriaId: 'external-link',
      },
      {
        stepNumber: 2,
        title: 'วางบล็อกลิงก์ภายในเว็บไซต์ (about.html)',
        instruction: 'คลิกหรือลากบล็อก "<a> ในเว็บ" มาต่อด้านล่าง เพื่อเชื่อมโยงไปยังไฟล์ about.html',
        recommendedBlockIds: ['a_internal'],
        criteriaId: 'internal-link',
      },
      {
        stepNumber: 3,
        title: 'ตรวจสอบข้อความลิงก์และกด ▶ Play',
        instruction: 'ตรวจสอบว่าลิงก์ทั้งสองมีข้อความคลิกได้ชัดเจน แล้วกดปุ่ม ▶ Play เพื่อทดสอบลิงก์',
        recommendedBlockIds: [],
        criteriaId: 'link-text',
      },
    ],
  },

  html_05: {
    lessonId: 'html_05',
    templates: LESSON_05_TEMPLATES,
    initialWorkspace: [createBlockInstance(LESSON_05_TEMPLATES[0])],
    solutionWorkspace: [
      createBlockInstance(LESSON_05_TEMPLATES[0]),
      createBlockInstance(LESSON_05_TEMPLATES[1]),
      createBlockInstance(LESSON_05_TEMPLATES[2]),
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'วางบล็อกรูปภาพ <img> และเลือกไฟล์ src',
        instruction: 'คลิกหรือลากบล็อก "<img>" มาต่อใต้หัวเรื่อง แล้วเลือกไฟล์รูปภาพในช่อง src',
        recommendedBlockIds: ['img_full'],
        criteriaId: 'has-src',
      },
      {
        stepNumber: 2,
        title: 'กำหนดคำอธิบายภาพ (alt) และความกว้าง (width)',
        instruction: 'ตรวจสอบช่องคำอธิบายภาพ (alt) และเลือกขนาดความกว้าง (width) เช่น 300 px แล้วกดปุ่ม ▶ Play',
        recommendedBlockIds: ['img_full', 'p_img_caption'],
        criteriaId: 'has-dimension',
      },
    ],
  },

  html_06: {
    lessonId: 'html_06',
    templates: LESSON_06_TEMPLATES,
    initialWorkspace: [createBlockInstance(LESSON_06_TEMPLATES[0])],
    solutionWorkspace: [
      createBlockInstance(LESSON_06_TEMPLATES[0]),
      createBlockInstance(LESSON_06_TEMPLATES[1], undefined, [
        createBlockInstance(LESSON_06_TEMPLATES[2]),
        createBlockInstance(LESSON_06_TEMPLATES[3]),
      ]),
      createBlockInstance(LESSON_06_TEMPLATES[4], undefined, [
        createBlockInstance(LESSON_06_TEMPLATES[5]),
        createBlockInstance(LESSON_06_TEMPLATES[6]),
      ]),
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'สร้างรายการ <ul> พร้อมหัวข้อย่อย <li> 2 รายการ',
        instruction: 'วางบล็อก "สร้างรายการ <ul>" แล้วใส่บล็อก "<li> #1" และ "<li> #2" เข้าไปด้านใน',
        recommendedBlockIds: ['list_container', 'li_item_1', 'li_item_2'],
        criteriaId: 'has-list',
      },
      {
        stepNumber: 2,
        title: 'สร้างตาราง <table> พร้อมแถวหัวตาราง <th>',
        instruction: 'วางบล็อก "เปิดตาราง <table>" แล้วใส่บล็อก "แถวหัวตาราง <tr> + <th>" เข้าไปด้านใน',
        recommendedBlockIds: ['table_container', 'tr_header_row'],
        criteriaId: 'has-th',
      },
      {
        stepNumber: 3,
        title: 'ใส่แถวข้อมูล <td> และกดปุ่ม ▶ Play',
        instruction: 'ใส่บล็อก "แถวข้อมูล <tr> + <td>" ต่อท้ายในตาราง แล้วกด ▶ Play เพื่อดูตารางผลลัพธ์',
        recommendedBlockIds: ['tr_data_row'],
        criteriaId: 'has-td',
      },
    ],
  },

  html_07: {
    lessonId: 'html_07',
    templates: LESSON_07_TEMPLATES,
    initialWorkspace: [createBlockInstance(LESSON_07_TEMPLATES[0])],
    solutionWorkspace: [
      createBlockInstance(LESSON_07_TEMPLATES[0]),
      createBlockInstance(LESSON_07_TEMPLATES[1], undefined, [
        createBlockInstance(LESSON_07_TEMPLATES[2]),
        createBlockInstance(LESSON_07_TEMPLATES[3]),
        createBlockInstance(LESSON_07_TEMPLATES[4]),
        createBlockInstance(LESSON_07_TEMPLATES[5]),
      ]),
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'วางบล็อกโครงสร้าง <form> และป้ายกำกับ <label>',
        instruction: 'วางบล็อก "เปิดแบบฟอร์ม <form>" บนกระดาน แล้วใส่บล็อก "ป้ายกำกับ <label>" เข้าไปด้านใน',
        recommendedBlockIds: ['form_container', 'label_field'],
        criteriaId: 'has-form-tag',
      },
      {
        stepNumber: 2,
        title: 'ใส่ช่องกรอกข้อความ (text) และอีเมล (email)',
        instruction: 'ใส่บล็อก "<input text>" และ "<input email>" เข้าไปในแบบฟอร์ม',
        recommendedBlockIds: ['input_text_field', 'input_email_field'],
        criteriaId: 'has-input-email',
      },
      {
        stepNumber: 3,
        title: 'ใส่ปุ่มส่งข้อมูล <button type="submit"> แล้วกด ▶ Play',
        instruction: 'ใส่บล็อก "ปุ่ม <button type=submit>" ปิดท้ายในฟอร์ม แล้วกด ▶ Play',
        recommendedBlockIds: ['button_submit'],
        criteriaId: 'has-submit-btn',
      },
    ],
  },

  html_08: {
    lessonId: 'html_08',
    templates: LESSON_08_TEMPLATES,
    initialWorkspace: [],
    solutionWorkspace: [
      createBlockInstance(LESSON_08_TEMPLATES[0], undefined, [
        createBlockInstance(LESSON_08_TEMPLATES[1]),
      ]),
      createBlockInstance(LESSON_08_TEMPLATES[2], undefined, [
        createBlockInstance(LESSON_08_TEMPLATES[3]),
        createBlockInstance(LESSON_08_TEMPLATES[4]),
      ]),
      createBlockInstance(LESSON_08_TEMPLATES[5], undefined, [
        createBlockInstance(LESSON_08_TEMPLATES[6]),
      ]),
      createBlockInstance(LESSON_08_TEMPLATES[7]),
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'สร้างส่วนหัวเว็บ <header> และเมนู <nav>',
        instruction: 'วางบล็อก "<header>" (ใส่ <h1> ด้านใน) และวางบล็อก "<nav>" พร้อมใส่ลิงก์ <a> ทั้ง 2 เมนูเข้าไปด้านใน',
        recommendedBlockIds: ['header_semantic', 'h1_portal', 'nav_semantic', 'nav_link_1', 'nav_link_2'],
        criteriaId: 'has-nav',
      },
      {
        stepNumber: 2,
        title: 'สร้างเนื้อหาหลัก <main> ครอบ <section>',
        instruction: 'วางบล็อก "<main>" แล้วใส่บล็อก "<section>" เข้าไปด้านในเพื่อจัดกลุ่มเนื้อหาหลัก',
        recommendedBlockIds: ['main_semantic', 'section_semantic'],
        criteriaId: 'has-section-or-article',
      },
      {
        stepNumber: 3,
        title: 'ปิดท้ายด้วยส่วนท้ายเว็บ <footer> แล้วกด ▶ Play',
        instruction: 'วางบล็อก "<footer>" ปิดท้ายหน้าเว็บ แล้วกดปุ่ม ▶ Play เพื่อรันโครงสร้าง Semantic HTML5',
        recommendedBlockIds: ['footer_semantic'],
        criteriaId: 'has-footer',
      },
    ],
  },
};

export function getLessonBlockConfig(lessonId: string): LessonBlockConfig | null {
  return LESSON_BLOCK_CONFIGS[lessonId] || null;
}

