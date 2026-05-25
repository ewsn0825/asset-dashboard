import FinanceDataReader as fdr
import json
import os
import pandas as pd

print("🚀 FinanceDataReader로 종목 데이터를 가져오는 중입니다...")

# 1. 데이터 가져오기
df = fdr.StockListing('KRX')

# 2. 어떤 컬럼이 있는지 확인 (에러 방지)
print(f"DEBUG: 사용 가능한 컬럼: {list(df.columns)}")

# 3. 실제 컬럼 이름에 맞춰 매핑 (보통 Code, Name, Marcap 등을 사용함)
# 만약 'MarketCap'이 없다면 'Marcap'일 가능성이 높습니다.
target_map = {
    'Code': 'id',
    'Name': 'name',
    'Marcap': 'marketCap',  # FinanceDataReader에서 시총은 보통 Marcap입니다.
    'MarketCap': 'marketCap'
}

# 컬럼 이름을 딕셔너리에 맞춰 변경
df = df.rename(columns=target_map)

# 필요한 컬럼만 선택 (없는 경우를 대비해 필터링)
available_cols = [c for c in ['id', 'name', 'marketCap'] if c in df.columns]
df = df[available_cols]

# 4. JSON 변환
stock_data = df.to_dict(orient='records')

# 5. 저장
current_dir = os.path.dirname(os.path.abspath(__file__))
target_path = os.path.join(current_dir, '..', 'data', 'stocks.json')
os.makedirs(os.path.dirname(target_path), exist_ok=True)

with open(target_path, 'w', encoding='utf-8') as f:
    json.dump(stock_data, f, ensure_ascii=False, indent=2)

print(f"🎉 완료! 총 {len(stock_data)}개 종목 데이터를 저장했습니다.")