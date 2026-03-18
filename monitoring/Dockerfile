# Use Python 3.11
FROM python:3.11-slim

WORKDIR /app

# Install Node.js for alert-rules.ts
RUN apt-get update && apt-get install -y curl gnupg
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Node dependencies  
COPY package.json .
RUN npm install --production

# Copy source
COPY . .

# Expose Streamlit port
EXPOSE 8501

# Run dashboard
CMD ["streamlit", "run", "dashboard.py", "--server.port=8501", "--server.address=0.0.0.0"]
