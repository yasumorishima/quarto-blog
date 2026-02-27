# WBC 2026、全20チームの選手データをブラウザで見れるアプリを作った

WBC 2026（ワールドベースボールクラシック）が今年3月に開幕します。

大谷翔平、フアン・ソト、コービン・バーンズ……各国の代表に選ばれた選手たちが、MLBでどんなデータを残しているのかを可視化するアプリを作りました。インストール不要、ブラウザだけで動きます。

---

## どんな画面が見られるか

ページを開くと、選手を選ばなくても**注目選手TOP3のカード**と**チーム全体のレーダーチャート**がすぐに表示されます。野球に詳しくなくても、各セクションに用語の説明キャプションが付いているので読みやすくなっています。

<!-- スクショ：スプレーチャート -->

打者は「スプレーチャート」でどこに打球を飛ばすタイプか、「ゾーンヒートマップ」でストライクゾーンのどこが得意・苦手かが一目でわかります。

<!-- スクショ：ゾーンヒートマップ -->

<!-- スクショ：投手 location マップ -->

投手は球種ごとの配球傾向、左打者・右打者への成績の違いなどを確認できます。変化量チャートで「このスライダーがどれだけ曲がるか」も見えます。投手レーダーチャートはK%（奪三振率）・Whiff%（空振率）・BB%・被打率・xwOBA・球速の6軸で投手陣の特徴を可視化します。

<!-- スクショ：変化量チャート -->

---

## 全20チーム対応

日本・アメリカ・ドミニカ共和国・メキシコ・韓国……全20チームのアプリを作りました。打者ダッシュボード17本、投手ダッシュボード13本、合計30アプリです。

- 🇯🇵 日本: [打者](https://wbc-japan-batters.streamlit.app/) / [投手](https://wbc-japan-pitchers.streamlit.app/)
- 🇺🇸 アメリカ: [打者](https://wbc-usa-batters.streamlit.app/) / [投手](https://wbc-usa-pitchers.streamlit.app/)
- 🇩🇴 ドミニカ共和国: [打者](https://wbc-dr-batters.streamlit.app/) / [投手](https://wbc-dr-pitchers.streamlit.app/)
- 🇲🇽 メキシコ: [打者](https://wbc-mex-batters.streamlit.app/) / [投手](https://wbc-mex-pitchers.streamlit.app/)
- 🇵🇷 プエルトリコ: [打者](https://wbc-pr-batters.streamlit.app/) / [投手](https://wbc-pr-pitchers.streamlit.app/)
- 🇰🇷 韓国: [打者](https://wbc-kor-batters.streamlit.app/) / [投手](https://wbc-kor-pitchers.streamlit.app/)
- 🇳🇱 オランダ: [打者](https://wbc-ned-batters.streamlit.app/) / [投手](https://wbc-ned-pitchers.streamlit.app/)
- 🇨🇦 カナダ: [打者](https://wbc-can-batters.streamlit.app/) / [投手](https://wbc-can-pitchers.streamlit.app/)
- 🇮🇹 イタリア: [打者](https://wbc-ita-batters.streamlit.app/) / [投手](https://wbc-ita-pitchers.streamlit.app/)
- 🇮🇱 イスラエル: [打者](https://wbc-isr-batters.streamlit.app/) / [投手](https://wbc-isr-pitchers.streamlit.app/)
- 🇬🇧 イギリス: [打者](https://wbc-gb-batters.streamlit.app/) / [投手](https://wbc-gb-pitchers.streamlit.app/)
- 🇵🇦 パナマ: [打者](https://wbc-pan-batters.streamlit.app/) / [投手](https://wbc-pan-pitchers.streamlit.app/)
- 🇨🇴 コロンビア: [打者](https://wbc-col-batters.streamlit.app/) / [投手](https://wbc-col-pitchers.streamlit.app/)
- 🇨🇺 キューバ: [打者](https://wbc-cuba-batters.streamlit.app/)
- 🇹🇼 チャイニーズタイペイ: [打者](https://wbc-twn-batters.streamlit.app/)
- 🇳🇮 ニカラグア: [打者](https://wbc-nic-batters.streamlit.app/)
- 🇦🇺 オーストラリア: [打者](https://wbc-aus-batters.streamlit.app/)

> アプリが「Zzzz」と表示されたら、ボタンを押して少し待つと起動します。

---

## データについて

使っているのは2024・2025シーズンのMLBレギュラーシーズンのStatcastデータです。WBC本番の試合データではなく、あくまで「この選手がMLBでどんなプレーをしているか」を確認するためのものです。

データはMLB公式サイト（Baseball Savant）から取得しています。

---

## Kaggleにもデータを公開しています

<!-- スクショ：Kaggleデータセットページ -->

Statcastデータを CSV 形式でそのまま公開しているので、自分で分析したい方はこちらからどうぞ。

https://www.kaggle.com/datasets/yasunorim/wbc-2026-scouting

---

選手の漏れや間違いがあったらすみません。「このチームの○○がいない！」みたいなのがあればぜひ教えてください。
