const body = JSON.parse($response.body);

function cleanTags(text) {
  if (!text) return text;
  return text.replace(/#[^\s#]+(\[话题\])?#?\s*/g, '').trim();
}

for (const block of body.data || []) {
  for (const note of block.note_list || []) {
    note.hash_tag = [];
    note.topics = [];
    note.desc = cleanTags(note.desc);
    if (note.share_info) {
      note.share_info.content = cleanTags(note.share_info.content);
      note.share_info.wechat_share_desc = cleanTags(note.share_info.wechat_share_desc);
    }
    if (note.qq_mini_program_info) {
      note.qq_mini_program_info.desc = cleanTags(note.qq_mini_program_info.desc);
    }
  }
}

$done({ body: JSON.stringify(body) });
