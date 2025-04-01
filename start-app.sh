#!/bin/bash
# Script to start Docker, backend, and frontend in tmux panes

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Script location - get the directory the script is in
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Define paths for WSL
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Check if Docker is running (from WSL)
echo -e "${YELLOW}Checking if Docker is running...${NC}"
if ! powershell.exe -Command "Get-Process -Name 'Docker Desktop' -ErrorAction SilentlyContinue" > /dev/null 2>&1; then
    echo -e "${YELLOW}Docker is not running. Starting Docker Desktop...${NC}"
    powershell.exe -Command "Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe'"
    
    # Wait for Docker to start
    echo -e "${YELLOW}Waiting for Docker to start...${NC}"
    tries=0
    max_tries=30
    docker_running=false
    
    while [ "$docker_running" = false ] && [ $tries -lt $max_tries ]; do
        sleep 5
        tries=$((tries+1))
        echo -e "${YELLOW}Checking if Docker is running (attempt $tries/$max_tries)...${NC}"
        
        # Check if Docker engine is responsive
        if docker info > /dev/null 2>&1; then
            docker_running=true
            echo -e "${GREEN}Docker is now running!${NC}"
        fi
    done
    
    if [ "$docker_running" = false ]; then
        echo -e "${RED}Error: Docker did not start within the expected time.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}Docker is already running.${NC}"
fi

# Session name
SESSION_NAME="dev-environment"

# Kill existing session if it exists
tmux kill-session -t $SESSION_NAME 2>/dev/null

# Create a new tmux session
tmux new-session -d -s $SESSION_NAME -n 'Development'

# Split the window into three panes
# Main layout: 
# +-----------------+
# |                 |
# |     Backend     |
# |                 |
# +-----------------+
# |                 |
# |    Frontend     |
# |                 |
# +-----------------+
# |    Terminal     |
# +-----------------+

#!/bin/bash
# Script to start Docker, backend, and frontend in tmux panes

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Script location - get the directory the script is in
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Define paths for WSL
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Verify directories exist
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}Error: Backend directory not found at $BACKEND_DIR${NC}"
    echo -e "${YELLOW}Please update the script with the correct backend path.${NC}"
    exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}Error: Frontend directory not found at $FRONTEND_DIR${NC}"
    echo -e "${YELLOW}Please update the script with the correct frontend path.${NC}"
    exit 1
fi

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo -e "${RED}tmux is not installed. Installing it now...${NC}"
    sudo apt update && sudo apt install -y tmux
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install tmux. Please install it manually with:${NC}"
        echo -e "${CYAN}sudo apt update && sudo apt install -y tmux${NC}"
        exit 1
    fi
fi

# Check if Docker is running (from WSL)
echo -e "${YELLOW}Checking if Docker is running...${NC}"
if ! powershell.exe -Command "Get-Process -Name 'Docker Desktop' -ErrorAction SilentlyContinue" > /dev/null 2>&1; then
    echo -e "${YELLOW}Docker is not running. Starting Docker Desktop...${NC}"
    powershell.exe -Command "Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe'"
    
    # Wait for Docker to start
    echo -e "${YELLOW}Waiting for Docker to start...${NC}"
    tries=0
    max_tries=30
    docker_running=false
    
    while [ "$docker_running" = false ] && [ $tries -lt $max_tries ]; do
        sleep 5
        tries=$((tries+1))
        echo -e "${YELLOW}Checking if Docker is running (attempt $tries/$max_tries)...${NC}"
        
        # Check if Docker engine is responsive
        if docker info > /dev/null 2>&1; then
            docker_running=true
            echo -e "${GREEN}Docker is now running!${NC}"
        fi
    done
    
    if [ "$docker_running" = false ]; then
        echo -e "${RED}Error: Docker did not start within the expected time.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}Docker is already running.${NC}"
fi

# Session name
SESSION_NAME="dev-environment"

# Kill existing session if it exists
tmux kill-session -t $SESSION_NAME 2>/dev/null

# Create a new tmux session
tmux new-session -d -s $SESSION_NAME -n 'Development'

# Split the window to create the desired layout:
# +----------------+----------------+
# |                |                |
# |    Backend     |    Frontend    |
# |                |                |
# +----------------+----------------+
# |                                 |
# |            Terminal             |
# |                                 |
# +---------------------------------+

# First split horizontally to create top and bottom sections
tmux split-window -v -t $SESSION_NAME:0
# Then split the top section vertically for backend and frontend
tmux split-window -h -t $SESSION_NAME:0.0

# Resize panes - make the top section larger for backend and frontend
tmux resize-pane -t $SESSION_NAME:0.2 -y 25%  # Make terminal smaller (25% of height)

# Send commands to start backend in the top-left pane
tmux send-keys -t $SESSION_NAME:0.0 "cd \"$BACKEND_DIR\" && echo -e \"${CYAN}Starting backend with Docker Compose...${NC}\"" C-m
tmux send-keys -t $SESSION_NAME:0.0 "docker compose up" C-m

# Send commands to start frontend in the top-right pane
tmux send-keys -t $SESSION_NAME:0.1 "cd \"$FRONTEND_DIR\" && echo -e \"${CYAN}Starting frontend with npm...${NC}\"" C-m
tmux send-keys -t $SESSION_NAME:0.1 "npm start" C-m

# Send help text to the bottom pane (terminal)
tmux send-keys -t $SESSION_NAME:0.2 "echo -e \"${GREEN}Welcome to your development environment!${NC}\"" C-m
tmux send-keys -t $SESSION_NAME:0.2 "echo -e \"${YELLOW}Tmux keyboard shortcuts:${NC}\"" C-m
tmux send-keys -t $SESSION_NAME:0.2 "echo -e \"${CYAN}- Ctrl+B then Arrow keys: Navigate between panes${NC}\"" C-m
tmux send-keys -t $SESSION_NAME:0.2 "echo -e \"${CYAN}- Ctrl+B then D: Detach from tmux (leave everything running)${NC}\"" C-m
tmux send-keys -t $SESSION_NAME:0.2 "echo -e \"${CYAN}- Ctrl+B then [: Enter scroll mode (press q to exit)${NC}\"" C-m
tmux send-keys -t $SESSION_NAME:0.2 "echo -e \"${CYAN}- Ctrl+B then Z: Zoom current pane (press again to unzoom)${NC}\"" C-m
tmux send-keys -t $SESSION_NAME:0.2 "echo -e \"${CYAN}- To reattach to this session later: tmux attach -t $SESSION_NAME${NC}\"" C-m
tmux send-keys -t $SESSION_NAME:0.2 "echo -e \"${CYAN}- To kill this session entirely: tmux kill-session -t $SESSION_NAME${NC}\"" C-m
tmux send-keys -t $SESSION_NAME:0.2 "echo" C-m
tmux send-keys -t $SESSION_NAME:0.2 "cd \"$SCRIPT_DIR\"" C-m

# Attach to the tmux session
echo -e "${GREEN}Starting tmux session with backend, frontend, and command terminal...${NC}"
tmux attach-session -t $SESSION_NAME


echo -e "${GREEN}Session ended. To reattach to the session if it's still running: tmux attach -t $SESSION_NAME${NC}"
