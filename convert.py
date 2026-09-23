import pandas as pd

# 📈 1. 同じ大元フォルダに置いた Excel ファイルを読み込みます
excel_file = 'src/assets/drink.xlsx'
df = pd.read_excel(excel_file)

# 🎯 2. 【解決策：出力パスの変更】
# 出来上がる JSON を、Ionic が見ている src/assets/ の部屋へ直接撃ち込むようにパスを合わせます！
output_json_file = 'src/assets/drink.json'

df.to_json(output_json_file, orient='records', force_ascii=False, indent=2)
print(f"[Success] 🎉 変換大成功！ {output_json_file} へ爆速保存しました！")