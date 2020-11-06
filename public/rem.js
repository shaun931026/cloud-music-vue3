const baseSize = 750
function setRem() {
  const scale = document.documentElement.clientWidth / baseSize
  document.documentElement.style.fontSize = baseSize * scale + 'px'
}
setRem()
window.onresize = function() {
  setRem()
}
