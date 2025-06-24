#!/bin/bash

# Acamae Backend Interactive Setup Script
# This script configures the development environment for new contributors.
# It is robust, interactive, and can also run in non-interactive mode with --non-interactive.

# --- Function to read Node.js requirements from package.json ---
get_node_requirements() {
    local package_json="package.json"
    if [ ! -f "$package_json" ]; then
        print_error "package.json not found. Cannot determine Node.js requirements."
        return 1
    fi

    # Extract Node.js version requirement using grep and sed
    local node_req=$(grep -o '"node":\s*"[^"]*"' "$package_json" | sed 's/"node":\s*"//;s/"//')

    if [ -z "$node_req" ]; then
        print_warning "Could not determine Node.js version requirement from package.json"
        echo "22.16.0"  # Default fallback
        return 0
    fi

    echo "$node_req"
}

# --- Function to compare Node.js versions ---
compare_node_versions() {
    local current_version="$1"
    local required_version="$2"

    # Extract major version numbers
    local current_major=$(echo "$current_version" | cut -d'.' -f1)
    local required_major=$(echo "$required_version" | cut -d'.' -f1)

    # Extract minor version numbers
    local current_minor=$(echo "$current_version" | cut -d'.' -f2)
    local required_minor=$(echo "$required_version" | cut -d'.' -f2)

    # Extract patch version numbers
    local current_patch=$(echo "$current_version" | cut -d'.' -f3 | cut -d'-' -f1)
    local required_patch=$(echo "$required_version" | cut -d'.' -f3 | cut -d'-' -f1)

    # Compare major versions
    if [ "$current_major" -gt "$required_major" ]; then
        echo "newer"
        return 0
    elif [ "$current_major" -lt "$required_major" ]; then
        echo "older"
        return 0
    fi

    # Major versions are equal, compare minor
    if [ "$current_minor" -gt "$required_minor" ]; then
        echo "newer"
        return 0
    elif [ "$current_minor" -lt "$required_minor" ]; then
        echo "older"
        return 0
    fi

    # Minor versions are equal, compare patch
    if [ "$current_patch" -gt "$required_patch" ]; then
        echo "newer"
        return 0
    elif [ "$current_patch" -lt "$required_patch" ]; then
        echo "older"
        return 0
    fi

    # All versions are equal
    echo "equal"
    return 0
}

# --- Function to get recommended Node.js version ---
get_recommended_node_version() {
    local node_req="$1"

    # Extract the minimum version from requirements like ">=22.16.0"
    if [[ "$node_req" == *">="* ]]; then
        echo "$node_req" | sed 's/>=\s*//'
    elif [[ "$node_req" == *"~"* ]]; then
        # For tilde ranges like "~22.16.0", use the base version
        echo "$node_req" | sed 's/~\s*//'
    elif [[ "$node_req" == *"^"* ]]; then
        # For caret ranges like "^22.16.0", use the base version
        echo "$node_req" | sed 's/\^\s*//'
    else
        echo "$node_req"
    fi
}

# --- Color definitions for output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Output helper functions ---
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}
print_error() {
    echo -e "${RED}❌ $1${NC}"
}
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# --- Interactive prompt helper ---
ask_yes_no() {
    local question="$1"
    local default="${2:-n}"
    if [ "$NON_INTERACTIVE" = true ]; then
        [ "$default" = "y" ] && return 0 || return 1
    fi
    if [ "$default" = "y" ]; then
        local prompt="$question (Y/n): "
    else
        local prompt="$question (y/N): "
    fi
    while true; do
        read -p "$prompt" -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]] || ([[ $REPLY =~ ^$ ]] && [[ $default = "y" ]]); then
            return 0
        elif [[ $REPLY =~ ^[Nn]$ ]] || ([[ $REPLY =~ ^$ ]] && [[ $default = "n" ]]); then
            return 1
        else
            echo "Please answer 'y' or 'n'"
        fi
    done
}

# --- Parse arguments for non-interactive mode ---
NON_INTERACTIVE=false
for arg in "$@"; do
    if [[ "$arg" == "--non-interactive" ]]; then
        NON_INTERACTIVE=true
    fi
done

# --- Dependency checks ---
print_info "Checking required dependencies..."
MISSING_DEPS=()
for dep in curl grep awk sed cut head cat mkdir cp mv rm; do
    if ! command -v $dep &> /dev/null; then
        MISSING_DEPS+=("$dep")
    fi
done
if ! command -v node &> /dev/null; then
    print_warning "Node.js is not installed. It will be handled later."
fi
if ! command -v npm &> /dev/null; then
    print_warning "npm is not installed. It will be handled later."
fi
if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    print_error "Missing required dependencies: ${MISSING_DEPS[*]}"
    print_info "Please install them and re-run this script."
    exit 1
fi

# --- Ensure script is run from project root ---
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_status "Checking environment..."

# --- Load NVM robustly ---
print_info "Checking for NVM installation..."
NVM_AVAILABLE=false
if command -v nvm &> /dev/null; then
    if nvm --version &> /dev/null; then
        NVM_AVAILABLE=true
        print_status "NVM is available: version $(nvm --version)"
    fi
fi

if [ "$NVM_AVAILABLE" = false ]; then
    print_info "NVM not found in PATH. Trying to load from $HOME/.nvm/nvm.sh..."
    if [ -s "$HOME/.nvm/nvm.sh" ]; then
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
        if command -v nvm &> /dev/null && nvm --version &> /dev/null; then
            NVM_AVAILABLE=true
            print_status "NVM loaded successfully: version $(nvm --version)"
        else
            print_warning "Tried to load NVM from $HOME/.nvm/nvm.sh but it did not work."
        fi
    fi
fi

if [ "$NVM_AVAILABLE" = false ]; then
    print_warning "NVM is not installed or not available in this shell."
    print_info "To install NVM, run:"
    echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "Then restart your terminal or run: source ~/.nvm/nvm.sh"
fi

# --- NVM and Node.js configuration ---
echo
print_info "NVM and Node.js configuration."

# Check if NVM is available in current session
NVM_AVAILABLE=false
if command -v nvm &> /dev/null; then
    NVM_AVAILABLE=true
    print_status "NVM detected in current session."
elif [ -s "$HOME/.nvm/nvm.sh" ]; then
    print_info "NVM found but not loaded in current session. Loading..."
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    if command -v nvm &> /dev/null; then
        NVM_AVAILABLE=true
        print_status "NVM loaded successfully."
    fi
fi

NVM_INSTALLED=false
if [ -d "$HOME/.nvm" ]; then
    NVM_INSTALLED=true
    if [ "$NVM_AVAILABLE" = false ]; then
        print_info "NVM directory found but not available in current session."
    fi
fi

if [ "$NVM_INSTALLED" = true ] && [ "$NVM_AVAILABLE" = false ]; then
    print_info "NVM is installed but not available in current session."
    if ask_yes_no "Load NVM configuration?" "y"; then
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
        if command -v nvm &> /dev/null; then
            print_status "NVM loaded successfully."
            NVM_AVAILABLE=true
        else
            print_error "Failed to load NVM."
        fi
    fi
elif [ "$NVM_INSTALLED" = false ]; then
    print_info "NVM is not installed."
    if ask_yes_no "Install NVM?" "y"; then
        if ! command -v curl &> /dev/null; then
            print_error "curl is required to install NVM. Please install curl."
            exit 1
        fi
        print_info "Installing NVM..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
        if command -v nvm &> /dev/null; then
            print_status "NVM installed successfully."
            NVM_AVAILABLE=true
        else
            print_error "Failed to install NVM."
        fi
    fi
fi

# --- Si tras todo esto NVM sigue sin estar disponible, abortar ---
if [ "$NVM_AVAILABLE" = false ]; then
    print_error "NVM is not available after attempted install/load. Aborting setup."
    print_info "Please install NVM manually and re-run this script."
    exit 1
fi

# --- Node.js version management ---
echo
print_info "Checking Node.js version compatibility..."
CURRENT_NODE_VERSION=$(node -v 2>/dev/null | sed 's/v//')
NODE_REQUIREMENT=$(get_node_requirements)
RECOMMENDED_VERSION=$(get_recommended_node_version "$NODE_REQUIREMENT")
echo "Current Node.js version: ${CURRENT_NODE_VERSION:-'not found'}"
echo "Recommended version from package.json: $RECOMMENDED_VERSION"

# Si node no está disponible, intentar activar la recomendada o la primera disponible
if [ -z "$CURRENT_NODE_VERSION" ]; then
    print_warning "Node.js is not available in PATH. Trying to activate recommended version with NVM..."
    if nvm list 2>/dev/null | grep -q "v$RECOMMENDED_VERSION"; then
        nvm use "$RECOMMENDED_VERSION"
        CURRENT_NODE_VERSION=$(node -v 2>/dev/null | sed 's/v//')
        print_status "Activated Node.js $CURRENT_NODE_VERSION with NVM."
    else
        FIRST_VERSION=$(nvm list 2>/dev/null | grep -o 'v[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1 | sed 's/v//')
        if [ -n "$FIRST_VERSION" ]; then
            nvm use "$FIRST_VERSION"
            CURRENT_NODE_VERSION=$(node -v 2>/dev/null | sed 's/v//')
            print_status "Activated Node.js $CURRENT_NODE_VERSION with NVM."
        fi
    fi
fi

# Si sigue sin estar disponible, abortar
if [ -z "$CURRENT_NODE_VERSION" ]; then
    print_error "Node.js is not available after NVM activation attempts. Aborting setup."
    print_info "Please install Node.js using NVM and re-run this script."
    exit 1
fi

# Comparar versiones y gestionar lógica
VERSION_COMPARISON=$(compare_node_versions "$CURRENT_NODE_VERSION" "$RECOMMENDED_VERSION")
case "$VERSION_COMPARISON" in
    "older")
        print_warning "Your Node.js version ($CURRENT_NODE_VERSION) is older than recommended ($RECOMMENDED_VERSION)."
        print_info "Install the recommended version?"
        if ask_yes_no "Install Node.js $RECOMMENDED_VERSION?" "y"; then
            print_info "Installing Node.js $RECOMMENDED_VERSION..."
            nvm install "$RECOMMENDED_VERSION"
            if [ $? -eq 0 ]; then
                print_status "Node.js $RECOMMENDED_VERSION installed."
                print_info "Switching to recommended version..."
                nvm use "$RECOMMENDED_VERSION"
                if [ $? -eq 0 ]; then
                    # Verify the change
                    NEW_NODE_VERSION=$(node -v 2>/dev/null | sed 's/v//')
                    if [ "$NEW_NODE_VERSION" = "$RECOMMENDED_VERSION" ]; then
                        print_status "✅ Successfully switched to Node.js $RECOMMENDED_VERSION"
                        print_info "Set as default version?"
                        if ask_yes_no "Set as default?" "y"; then
                            nvm alias default "$RECOMMENDED_VERSION"
                            print_status "Node.js $RECOMMENDED_VERSION set as default."
                        fi
                    else
                        print_warning "⚠️  Version switch failed. Current version: $NEW_NODE_VERSION"
                    fi
                else
                    print_error "Failed to switch to Node.js $RECOMMENDED_VERSION"
                fi
            else
                print_error "Failed to install Node.js $RECOMMENDED_VERSION."
            fi
        else
            print_warning "You are using an older Node.js version. Some features may not work correctly."
        fi
        ;;
    "newer")
        print_status "Your Node.js version ($CURRENT_NODE_VERSION) is newer than recommended ($RECOMMENDED_VERSION)."
        print_info "This should be compatible, but for optimal compatibility, consider using the recommended version."

        # Try to switch to recommended version automatically
        print_info "Attempting to switch to recommended version..."

        # First, try to use the recommended version if it's already installed
        if nvm list 2>/dev/null | grep -q "v$RECOMMENDED_VERSION"; then
            print_info "Recommended version ($RECOMMENDED_VERSION) is already installed. Switching..."
            nvm use "$RECOMMENDED_VERSION"
            if [ $? -eq 0 ]; then
                # Verify the change
                NEW_NODE_VERSION=$(node -v 2>/dev/null | sed 's/v//')
                if [ "$NEW_NODE_VERSION" = "$RECOMMENDED_VERSION" ]; then
                    print_status "✅ Successfully switched to Node.js $RECOMMENDED_VERSION"
                    print_info "Set as default version?"
                    if ask_yes_no "Set as default?" "n"; then
                        nvm alias default "$RECOMMENDED_VERSION"
                        print_status "Node.js $RECOMMENDED_VERSION set as default."
                    fi
                else
                    print_warning "⚠️  Version switch failed. Current version: $NEW_NODE_VERSION"
                fi
            else
                print_error "Failed to switch to Node.js $RECOMMENDED_VERSION"
            fi
        else
            # Recommended version not installed, offer to install it
            print_info "Recommended version ($RECOMMENDED_VERSION) is not installed."
            print_info "Install the recommended version for optimal compatibility?"
            if ask_yes_no "Install Node.js $RECOMMENDED_VERSION?" "n"; then
                print_info "Installing Node.js $RECOMMENDED_VERSION..."
                nvm install "$RECOMMENDED_VERSION"
                if [ $? -eq 0 ]; then
                    print_status "Node.js $RECOMMENDED_VERSION installed."
                    print_info "Switching to recommended version..."
                    nvm use "$RECOMMENDED_VERSION"
                    if [ $? -eq 0 ]; then
                        # Verify the change
                        NEW_NODE_VERSION=$(node -v 2>/dev/null | sed 's/v//')
                        if [ "$NEW_NODE_VERSION" = "$RECOMMENDED_VERSION" ]; then
                            print_status "✅ Successfully switched to Node.js $RECOMMENDED_VERSION"
                            print_info "Set as default version?"
                            if ask_yes_no "Set as default?" "n"; then
                                nvm alias default "$RECOMMENDED_VERSION"
                                print_status "Node.js $RECOMMENDED_VERSION set as default."
                            fi
                        else
                            print_warning "⚠️  Version switch failed. Current version: $NEW_NODE_VERSION"
                        fi
                    else
                        print_error "Failed to switch to Node.js $RECOMMENDED_VERSION"
                    fi
                else
                    print_error "Failed to install Node.js $RECOMMENDED_VERSION."
                fi
            else
                print_warning "You are using a newer Node.js version. Some features may not work as expected."
            fi
        fi
        ;;
    "equal")
        print_status "Your Node.js version ($CURRENT_NODE_VERSION) matches the recommended version ($RECOMMENDED_VERSION)."
        ;;
    *)
        print_warning "Could not determine version compatibility."
        ;;
esac

echo
print_info "Final Node.js configuration:"
echo "Current version: $(node --version)"
echo "npm version: $(npm --version)"

# --- Verificar si el cambio de versión se aplicó correctamente ---
FINAL_NODE_VERSION=$(node -v 2>/dev/null | sed 's/v//')
if [ "$FINAL_NODE_VERSION" != "$CURRENT_NODE_VERSION" ]; then
    print_status "✅ Node.js version changed from $CURRENT_NODE_VERSION to $FINAL_NODE_VERSION"
    # Update CURRENT_NODE_VERSION for the rest of the script
    CURRENT_NODE_VERSION="$FINAL_NODE_VERSION"
else
    print_info "Node.js version remains: $FINAL_NODE_VERSION"
fi

# --- Resumen de decisiones en modo no interactivo ---
if [ "$NON_INTERACTIVE" = true ]; then
    echo
    print_info "[Non-interactive mode] Summary of automatic decisions:"
    echo "- NVM available: $NVM_AVAILABLE"
    echo "- Node.js version: $CURRENT_NODE_VERSION"
    echo "- Recommended Node.js version: $RECOMMENDED_VERSION"
    echo "- Version comparison: $VERSION_COMPARISON"
    echo "- NVM directory: $NVM_DIR"
fi

# Check for npm and offer updates
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed or not in PATH."
    exit 1
fi
CURRENT_NPM_VERSION=$(npm -v)
print_status "npm version: $CURRENT_NPM_VERSION"

# Get npm requirement from package.json engines field
NPM_REQUIREMENT=$(grep -o '"npm":\s*"[^"]*"' package.json 2>/dev/null | sed 's/"npm":\s*"//;s/"//' || echo "")
if [ -n "$NPM_REQUIREMENT" ]; then
    RECOMMENDED_NPM_VERSION=$(get_recommended_node_version "$NPM_REQUIREMENT")
    NPM_COMPARISON=$(compare_node_versions "$CURRENT_NPM_VERSION" "$RECOMMENDED_NPM_VERSION")
    case "$NPM_COMPARISON" in
        "older")
            print_warning "npm version $CURRENT_NPM_VERSION is older than recommended $RECOMMENDED_NPM_VERSION"
            print_info "Update npm to recommended version?"
            if ask_yes_no "Update npm to $RECOMMENDED_NPM_VERSION?" "n"; then
                print_info "Updating npm..."
                npm install -g "npm@$RECOMMENDED_NPM_VERSION"
                if [ $? -eq 0 ]; then
                    print_status "npm updated successfully."
                    echo "New npm version: $(npm -v)"
                else
                    print_error "Failed to update npm."
                fi
            else
                print_warning "You are using an older npm version. Some features may not work correctly."
            fi
            ;;
        "newer")
            print_status "npm version $CURRENT_NPM_VERSION is newer than recommended $RECOMMENDED_NPM_VERSION"
            print_info "This should be compatible."
            ;;
        "equal")
            print_status "npm version $CURRENT_NPM_VERSION matches recommended version $RECOMMENDED_NPM_VERSION"
            ;;
        *)
            print_warning "Could not determine npm version compatibility."
            ;;
    esac
else
    print_info "No specific npm version requirement found in package.json."
fi

# Only ask about updating NVM if it's an old version
NVM_VERSION=$(nvm --version)
if [ "$NVM_VERSION" != "0.39.5" ] && [ "$NVM_VERSION" != "0.39.0" ]; then
    echo
    print_info "NVM version: $NVM_VERSION"
    if ask_yes_no "Update NVM to latest version?" "n"; then
        print_info "Updating NVM..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
        print_status "NVM updated."
    fi
fi

# --- Configurar NVM para sesiones futuras ---
echo
print_info "Configuring NVM for future sessions..."
NVM_CONFIG_LINE='export NVM_DIR="$HOME/.nvm"\n[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"  # This loads nvm\n[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion'
if ! grep -q "NVM_DIR" ~/.bashrc; then
    print_info "Adding NVM config to ~/.bashrc..."
    echo -e "\n# NVM Configuration\n$NVM_CONFIG_LINE" >> ~/.bashrc
    print_status "NVM config added to ~/.bashrc."
else
    print_info "NVM config already present in ~/.bashrc."
fi
if [ -f ~/.zshrc ] && ! grep -q "NVM_DIR" ~/.zshrc; then
    print_info "Adding NVM config to ~/.zshrc..."
    echo -e "\n# NVM Configuration\n$NVM_CONFIG_LINE" >> ~/.zshrc
    print_status "NVM config added to ~/.zshrc."
elif [ -f ~/.zshrc ]; then
    print_info "NVM config already present in ~/.zshrc."
fi
if [ -f ~/.profile ] && ! grep -q "NVM_DIR" ~/.profile; then
    print_info "Adding NVM config to ~/.profile..."
    echo -e "\n# NVM Configuration\n$NVM_CONFIG_LINE" >> ~/.profile
    print_status "NVM config added to ~/.profile."
elif [ -f ~/.profile ]; then
    print_info "NVM config already present in ~/.profile."
fi
echo
print_status "NVM configuration complete!"
echo
echo "NVM useful commands:"
echo "- nvm list                    - List installed versions"
echo "- nvm install <version>       - Install a specific version"
echo "- nvm use <version>           - Switch to a specific version"
echo "- nvm alias default <version> - Set default version"
echo "- nvm current                 - Show current version"
echo "- nvm --version               - Show NVM version"
echo
print_info "💡 To apply changes in new terminals:"
print_info "  - Close and reopen your terminal"
print_info "  - Or run: source ~/.bashrc"

# --- Verificar si el cambio de versión se aplicó correctamente ---
FINAL_NODE_VERSION=$(node -v 2>/dev/null | sed 's/v//')
if [ "$FINAL_NODE_VERSION" != "$CURRENT_NODE_VERSION" ]; then
    print_status "Node.js version changed from $CURRENT_NODE_VERSION to $FINAL_NODE_VERSION"
else
    print_info "Node.js version remains: $FINAL_NODE_VERSION"
fi

# --- Aplicar cambios automáticamente si se ejecuta con source ---
if [ "$VERSION_COMPARISON" = "newer" ] || [ "$VERSION_COMPARISON" = "older" ]; then
    echo
    # Check if the version actually changed
    if [ "$FINAL_NODE_VERSION" = "$RECOMMENDED_VERSION" ]; then
        print_status "✅ Node.js version successfully changed to recommended version ($RECOMMENDED_VERSION)"
    else
        # Version didn't change - give instructions
        # Check if script is being sourced (executed with 'source' or '.')
        if [ "$BASH_SOURCE" != "$0" ]; then
            # Script is being sourced - apply changes automatically
            print_info "💡 Script executed with 'source' - applying changes to current session..."
            source ~/.bashrc
            UPDATED_NODE_VERSION=$(node -v 2>/dev/null | sed 's/v//')
            if [ "$UPDATED_NODE_VERSION" != "$FINAL_NODE_VERSION" ]; then
                print_status "✅ Changes applied! Current Node.js: $(node --version)"
            else
                print_warning "⚠️  Version didn't change. You may need to restart your terminal."
                print_info "To manually switch: nvm use $RECOMMENDED_VERSION"
            fi
        else
            # Script executed directly - give instructions
            echo
            print_warning "⚠️  IMPORTANT: Node.js version changes were made but need to be applied to your current session."
            echo
            print_info "💡 To apply Node.js version changes in your current terminal session:"
            print_info "  Option 1 (Recommended): Run: nvm use $RECOMMENDED_VERSION"
            print_info "  Option 2: Run: source ~/.bashrc (reloads all NVM config)"
            print_info "  Option 3: Restart your terminal"
            print_info "  Option 4: Execute this script with: source ./scripts/setup-initial-config.sh"
            echo
            print_info "  Then verify with: node --version"
            echo
            print_warning "⚠️  You must run one of these commands to see the changes take effect!"
            echo
        fi
    fi
fi

# --- SSL Certificate Generation ---
echo
print_info "SSL Certificate Configuration"
if [ -f "scripts/generate-ssl.js" ]; then
    print_info "SSL certificate generator found."
    if ask_yes_no "Generate SSL certificates for development?" "y"; then
        print_info "Generating SSL certificates..."
        node scripts/generate-ssl.js
        if [ $? -eq 0 ]; then
            print_status "SSL certificates generated successfully."
        else
            print_error "Failed to generate SSL certificates."
        fi
    fi
else
    print_warning "SSL certificate generator (scripts/generate-ssl.js) not found."
    print_info "SSL certificates will not be generated automatically."
fi

# --- Docker verification ---
echo
print_info "Verifying Docker..."
if ! command -v docker &> /dev/null; then
    print_warning "Docker is not installed. Some features may not be available."
    print_info "Install Docker Desktop from: https://www.docker.com/products/docker-desktop/"
    print_info "You can continue with local configuration only."
else
    print_status "Docker $(docker --version) detected."
    if ! docker info &> /dev/null; then
        print_warning "Docker is not running. Start Docker Desktop."
        print_info "Check Docker Desktop settings:"
        print_info "1. Open Docker Desktop"
        print_info "2. Go to Settings > General"
        print_info "3. Ensure 'Use WSL 2 based engine' is selected (default)"
        print_info "4. Restart Docker Desktop"
        print_warning "Continuing setup, but Docker will not be available."
    else
        print_status "Docker is running correctly."
        echo
        print_info "Docker system info:"
        docker info --format "table {{.Name}}\t{{.Value}}" | head -5
        echo
        print_info "Testing Docker basic functionality..."
        if docker run --rm hello-world &> /dev/null; then
            print_status "Docker test successful."
        else
            print_warning "Docker test failed - possible network or permission issues."
        fi
    fi
fi

# --- Docker environment configuration ---
echo
print_info "Configuring Docker environment for the project..."

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_warning "Docker Compose is not installed."
    print_info "Install Docker Compose from: https://docs.docker.com/compose/install/"
else
    print_status "Docker Compose is available."

    # Create Docker network if it doesn't exist
    print_status "Creating Docker network..."
    if ! docker network ls | grep -q "acamae-network"; then
        npm run docker:create:net
        if [ $? -eq 0 ]; then
            print_status "Docker network created successfully."
        else
            print_warning "Failed to create Docker network."
        fi
    else
        print_status "Docker network 'acamae-network' already exists."
    fi
fi

# --- Project setup ---
echo
print_info "Project setup..."
print_status "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies."
    exit 1
fi
print_status "Configuring environment variables..."
if [ ! -f ".env.development" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env.development
        print_status ".env.development created from .env.example."
        print_warning "Edit .env.development with your specific values."
    else
        print_warning ".env.example not found. Create .env.development manually."
    fi
fi
if [ ! -f ".env.production" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env.production
        print_status ".env.production created from .env.example."
        print_warning "Edit .env.production with your production values."
    else
        print_warning ".env.example not found. Create .env.production manually."
    fi
fi
print_status "Generating Prisma client..."
npm run setup:env
npm run prisma:generate
if [ $? -ne 0 ]; then
    print_error "Failed to generate Prisma client."
    exit 1
fi
print_status "Checking database configuration..."
if [ -f ".env.development" ]; then
    if grep -q "DATABASE_URL" .env.development; then
        print_status "DATABASE_URL found in .env.development."
    else
        print_warning "DATABASE_URL not found in .env.development."
    fi
fi
print_status "Configuring Docker environment variables..."
DOCKER_ENV_FILE="docker/.env"
if [ ! -f "$DOCKER_ENV_FILE" ]; then
    print_status "Creating Docker .env file..."
    mkdir -p docker
    if [ -f ".env.development" ]; then
        MYSQL_ROOT_PASSWORD=$(grep "^MYSQL_ROOT_PASSWORD=" .env.development | cut -d'=' -f2)
        if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
            MYSQL_ROOT_PASSWORD="rootpassword"
            print_warning "MYSQL_ROOT_PASSWORD not found, using default."
        fi
        MYSQL_DATABASE=$(grep "^MYSQL_DATABASE=" .env.development | cut -d'=' -f2)
        if [ -z "$MYSQL_DATABASE" ]; then
            MYSQL_DATABASE="gestion_esports"
            print_warning "MYSQL_DATABASE not found, using default."
        fi
        cat > "$DOCKER_ENV_FILE" << EOF
# Docker Compose specific variables
# Auto-generated from .env.development
MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD
MYSQL_DATABASE=$MYSQL_DATABASE
EOF
        print_status "$DOCKER_ENV_FILE created from .env.development."
    else
        print_warning ".env.development not found, creating Docker .env file with defaults."
        cat > "$DOCKER_ENV_FILE" << EOF
# Docker Compose specific variables
# Default values
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=gestion_esports
EOF
    fi
else
    print_status "$DOCKER_ENV_FILE already exists."
fi
print_status "Creating Docker network..."
# Check if network exists before trying to create it
if ! docker network ls | grep -q "acamae-network"; then
    npm run docker:create:net
    if [ $? -eq 0 ]; then
        print_status "Docker network created successfully."
    else
        print_warning "Failed to create Docker network."
    fi
else
    print_status "Docker network 'acamae-network' already exists."
fi

# --- Final summary and next steps ---
echo
print_status "🎉 Setup completed successfully!"

echo
print_info "Setup completed! Your development environment is ready."
print_info "Next steps:"
print_info "1. Configure backend:"
print_info "   npm run setup:backend"
print_info "2. Start development:"
print_info "   npm run docker:up"
print_info "3. Access your application:"
print_info "   - API: https://localhost/api"
print_info "   - phpMyAdmin: https://localhost/phpmyadmin"

echo
print_status "🎉 Setup script completed!"
