FROM python:3.12-slim
 
ENV PYTHONUNBUFFERED=1
 
WORKDIR /app
 
COPY requirements.txt .
 
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install "fastapi[standard]"
 
COPY . .
 
RUN useradd appuser
 
RUN chown -R appuser:appuser /app/ && chmod -R 755 /app/
RUN chmod 777 entrypoint.sh
 
USER appuser

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]