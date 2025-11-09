/*
格式化歌词工具，终端执行
将多行文本转换为单行字符串，换行符为 \n
*/

let inputChunks = [];

process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  inputChunks.push(chunk);
});

process.stdin.on('end', () => {
  const fullInput = inputChunks.join('');
  // 统一换行符为 \n，并转义为字面量 "\\n"
  const result = fullInput
    .replace(/\r\n/g, '\n') // 兼容 Windows 换行
    .replace(/\n/g, '\\n'); // 转义换行为字面量 \n

  console.log(result);
});