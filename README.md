# 主要野菜の収穫量

農林水産省「作物統計調査／野菜生産出荷統計」の全国・年間収穫量を比較する可視化ページです。

このサイトは GPT 6 Astra で作成されました。

**公開ページ：https://katzkawai.org/kklab-vegetables-stats/**

- 1973〜2024年、現在の指定野菜に対応する15品目
- 期間・品目選択、収穫量（万t）と指数（開始年＝100）の切替
- 終了年の収穫量、期間増減率、実数比較表、表示データのCSV保存
- 出典・計算式の確認、PC・スマートフォン対応

## データ

[農林水産省・作況調査（野菜）](https://www.maff.go.jp/j/tokei/kouhyou/sakumotu/sakkyou_yasai/)から案内されている[e-Stat長期累年表](https://www.e-stat.go.jp/stat-search/files?layout=datalist&lid=000001486220&page=1)の全国表（根菜類・葉茎菜類・果菜類）を使用。原表更新日は2026年7月3日、取得日は2026年9月17日です。

対象：ばれいしょ、キャベツ、たまねぎ、だいこん、はくさい、トマト、レタス、にんじん、きゅうり、ねぎ、なす、ほうれんそう、ブロッコリー、ピーマン、さといも。

「主要野菜」はこのページでは2026年9月時点の指定野菜15品目に対応させています。過去の指定状況や、統計表の「主要野菜計」と同じ範囲を示すものではありません。

- 公表された品目の年間計を使用し、季節別の値は加算しません。ばれいしょには春植え・秋植え、トマトにはミニトマト・加工用が含まれます。
- ブロッコリーは1989年にカリフラワーから分離。1973〜1988年の16件は欠測（JSONの`null`、CSVの空欄）とし、0への置換や補間は行いません。
- 基準年が未掲載の場合、指数・増減率は計算しません。
- 主産県調査年の全国値には農林水産省による推計を含みます。
- 2025年産は一部品目のみ公表されているため、15品目を共通の期間で比較できる2024年産までを使用します。
- 収穫量は出荷量・消費量とは異なります。増減から天候や需要などの因果関係を断定しません。

`data/harvest.csv`には原表のファイル名・セル位置も収録。`data/metadata.json`にはダウンロードURLとSHA-256を保存しています。

## 検証

780件（52年×15品目）の一意性と16件の欠測を確認しました。別途公表された[令和6年産・全国確報表](https://www.e-stat.go.jp/stat-search/files?layout=dataset&stat_infid=000040389426)により、2019〜2024年の全90値を照合しています。

```bash
python3 scripts/verify_data.py
node --test tests/vegetables.test.mjs
```

## データの再生成

元のExcelは`data/raw/`に保存済みです。Pythonライブラリはスクリプトにバージョン指定しています。

```bash
uv run scripts/prepare_data.py
python3 scripts/verify_data.py
```

新しい公表年へ更新する際は、新しい公式ファイルと公表情報を確認し、取得URL・期間・注記・照合用ファイル・UIの年範囲を更新してください。単に日付を変えるだけでは更新できません。

## ページの編集・ビルド

`app/src/content/dashboard/`が可視化のReact・CSS・計算処理、`app/src/data.json`が表示用データです。Dataプラグインの共通ランタイムを利用しています。

Dataプラグインのインストール先を指定してビルドします。公開用ファイルは`docs/`に同梱されており、GitHub Pagesでの配信時にNodeやPythonは不要です。

```bash
export DATA_PLUGIN_ROOT=/path/to/data-analytics/plugin
# 作業完了時に app/src/data.json の buildStatus を complete に設定
./scripts/build_site.sh
python3 -m http.server 8766 --bind 127.0.0.1 --directory docs
```

`package_site.py`はビルド結果のハッシュと完了状態を検証してから公開ファイルをコピーします。データの新規取得を伴わないページ編集では、収録年・取得日時を変更しません。

## GitHub Pages

Settings → Pages → Deploy from a branch → `main` / `/docs`。
`docs/`の更新をmainへpushすると再公開されます。ページ上のフィルターはブラウザ内で動作し、表示データは同一サイトに同梱されています。

## 出典・利用について

本サイトは農林水産省の公式サイトではありません。掲載データは農林水産省の統計を加工したものです。原資料の利用には農林水産省・e-Statの利用規約をご確認ください。出典はページ下部と各図表の出典表示から参照できます。
