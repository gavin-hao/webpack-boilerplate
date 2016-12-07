require('../css/main.css');
var dlg=require('./components/dialog');

var p=document.createElement('p')
p.innerHTML='这是由js生成的一句话。';
document.querySelector('.g-bd').appendChild(p);
console.log('this is a index.js entry');
dlg();