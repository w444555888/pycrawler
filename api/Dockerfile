# Dockerfile
FROM python:3.12-slim

WORKDIR /app

# 安裝必要套件（timezonefinder 等套件可能需要 build 工具）
RUN apt-get update && apt-get install -y build-essential gcc libffi-dev

# 安裝 Poetry
RUN pip install --no-cache-dir poetry

# 複製 pyproject
COPY pyproject.toml poetry.lock* ./

# 安裝依賴（不要建立虛擬環境，直接安裝到全局）
RUN poetry config virtualenvs.create false \
    && poetry install --only main --no-root

# 複製程式碼
COPY api /app

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]