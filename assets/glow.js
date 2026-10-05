// 画面の上に差す光の色を、スクロールに合わせて変える(藍→千歳緑→深緋→江戸紫→金)
// アプリの「資産が育つと、光の色が変わる」をページでも感じられるようにする
(function () {
  var tiers = [
    [47, 79, 154], // 藍
    [31, 110, 82], // 千歳緑
    [155, 35, 53], // 深緋
    [107, 63, 160], // 江戸紫
    [176, 138, 62], // 金
  ];
  var el = document.querySelector('.glow');
  if (!el) return;
  function update() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var t = Math.min(1, Math.max(0, window.scrollY / Math.max(1, max))) * (tiers.length - 1);
    var i = Math.min(tiers.length - 2, Math.floor(t));
    var f = t - i;
    var c = tiers[i].map(function (v, k) {
      return Math.round(v + (tiers[i + 1][k] - v) * f);
    });
    el.style.setProperty('--glow', 'rgba(' + c.join(',') + ',0.5)');
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
