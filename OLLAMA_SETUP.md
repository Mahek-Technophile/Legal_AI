# Ollama Installation and Setup Guide

## The Error You're Seeing

The error `jsh: can't open input file: /bin` suggests there's an issue with your shell or the installation script. Let's fix this step by step.

## Installation Methods by Operating System

### For Windows

1. **Download the Windows Installer**
   - Go to https://ollama.ai/download
   - Download the Windows installer (.exe file)
   - Run the installer as administrator

2. **Alternative: Using PowerShell**
   ```powershell
   # Open PowerShell as Administrator
   Invoke-WebRequest -Uri "https://ollama.ai/install.ps1" -OutFile "install.ps1"
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   .\install.ps1
   ```

### For macOS

1. **Download the macOS App**
   - Go to https://ollama.ai/download
   - Download the .dmg file
   - Install like any other macOS application

2. **Using Homebrew**
   ```bash
   brew install ollama
   ```

### For Linux

1. **Try the corrected curl command**
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. **If curl flags don't work, try this**
   ```bash
   curl -L https://ollama.ai/install.sh | sh
   ```

3. **Manual download and install**
   ```bash
   # Download the script
   wget https://ollama.ai/install.sh
   
   # Make it executable
   chmod +x install.sh
   
   # Run it
   ./install.sh
   ```

4. **Direct binary installation**
   ```bash
   # Download the binary
   curl -L https://github.com/ollama/ollama/releases/latest/download/ollama-linux-amd64 -o ollama
   
   # Make it executable
   chmod +x ollama
   
   # Move to system path
   sudo mv ollama /usr/local/bin/
   ```

## After Installation

### 1. Start Ollama Service

**Windows:**
- Ollama should start automatically after installation
- If not, search for "Ollama" in Start menu and run it

**macOS:**
- Open the Ollama app from Applications
- It will run in the background

**Linux:**
```bash
# Start Ollama service
ollama serve
```

### 2. Verify Ollama is Running

Open a new terminal/command prompt and run:
```bash
ollama --version
```

You should see version information if Ollama is installed correctly.

### 3. Pull the llama3.2 Model

```bash
ollama pull llama3.2
```

This will download the llama3.2 model (about 2GB).

### 4. Verify the Model is Available

```bash
ollama list
```

You should see `llama3.2` in the list of available models.

### 5. Test the Model

```bash
ollama run llama3.2 "Hello, how are you?"
```

## Troubleshooting

### If you get "command not found: ollama"

1. **Check if Ollama is in your PATH**
   ```bash
   which ollama
   ```

2. **Add Ollama to PATH (Linux/macOS)**
   ```bash
   echo 'export PATH=$PATH:/usr/local/bin' >> ~/.bashrc
   source ~/.bashrc
   ```

3. **Restart your terminal**

### If Ollama won't start

1. **Check if port 11434 is available**
   ```bash
   # Linux/macOS
   lsof -i :11434
   
   # Windows
   netstat -an | findstr :11434
   ```

2. **Kill any existing Ollama processes**
   ```bash
   # Linux/macOS
   pkill ollama
   
   # Windows
   taskkill /f /im ollama.exe
   ```

3. **Start Ollama again**
   ```bash
   ollama serve
   ```

### If model download fails

1. **Check your internet connection**
2. **Try downloading a smaller model first**
   ```bash
   ollama pull llama3.2:1b
   ```
3. **Clear Ollama cache and try again**
   ```bash
   # Linux/macOS
   rm -rf ~/.ollama
   
   # Windows
   rmdir /s %USERPROFILE%\.ollama
   ```

## Using with the Legal AI Application

Once Ollama is running with llama3.2:

1. **Refresh the application** - The chat interfaces will automatically detect Ollama
2. **The status indicator** should show "Ollama Ready" 
3. **You can now chat** with the AI-powered legal assistants
4. **All processing is local** - no data leaves your machine

## Configuration

The application uses these default settings:
- **Ollama URL**: http://localhost:11434
- **Default Model**: llama3.2

You can change these in your `.env` file:
```env
VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_OLLAMA_MODEL=llama3.2
```

## Alternative Models

If llama3.2 doesn't work, try these alternatives:

```bash
# Smaller, faster model
ollama pull llama3.2:1b

# Previous version
ollama pull llama3.1:8b

# Specialized models
ollama pull mistral:7b
ollama pull phi3:14b
```

## Need Help?

If you're still having issues:

1. **Check the Ollama documentation**: https://ollama.ai/docs
2. **Join the Ollama Discord**: https://discord.gg/ollama
3. **Check GitHub issues**: https://github.com/ollama/ollama/issues

The legal AI application will work as soon as Ollama is running with any compatible model!