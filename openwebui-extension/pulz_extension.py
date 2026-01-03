"""
PulZ OpenWebUI Extension
Phase D0 Hard Execution Mode

This extension embeds the PulZ revenue system as a panel within OpenWebUI.
The PulZ UI is served from the Next.js static build at /control-room/out/

Installation:
1. Copy this file to your OpenWebUI extensions directory
2. Build the PulZ UI: cd control-room && pnpm build
3. Configure the PULZ_BUILD_PATH environment variable to point to /control-room/out/
4. Restart OpenWebUI

The extension adds a "PulZ Revenue" panel to the OpenWebUI sidebar with routes:
- /pulz/opportunities - Opportunity intake
- /pulz/drafts - Response drafting
- /pulz/jobs - Fulfillment tracking
- /pulz/revenue - Revenue summary
"""

import os
from typing import Optional
from pathlib import Path

# Extension metadata
NAME = "PulZ Revenue System"
VERSION = "1.0.0"
DESCRIPTION = "Internal revenue operations system for 3D printing and software services"
AUTHOR = "3d3dcanada"

class PulzExtension:
    """
    PulZ extension for OpenWebUI.

    Provides:
    - Opportunity intake (physical & software services)
    - Response drafting with approval workflow
    - Job fulfillment tracking
    - Revenue event logging
    - Financial summary dashboard
    """

    def __init__(self):
        self.build_path = os.getenv('PULZ_BUILD_PATH', '/app/pulz/control-room/out')
        self.enabled = self._check_build_exists()

    def _check_build_exists(self) -> bool:
        """Check if the PulZ build exists."""
        build_dir = Path(self.build_path)
        index_file = build_dir / 'index.html'

        if not index_file.exists():
            print(f"[PulZ] Warning: Build not found at {self.build_path}")
            print(f"[PulZ] Run 'cd control-room && pnpm build' to generate the UI")
            return False

        return True

    def get_routes(self) -> list:
        """
        Return routes to be registered in OpenWebUI.

        Routes:
        - /pulz/* - Serve static files from Next.js build
        """
        if not self.enabled:
            return []

        return [
            {
                'path': '/pulz',
                'method': 'GET',
                'handler': self.serve_index,
            },
            {
                'path': '/pulz/{path:path}',
                'method': 'GET',
                'handler': self.serve_static,
            },
        ]

    def serve_index(self):
        """Serve the PulZ index page."""
        index_path = Path(self.build_path) / 'index.html'

        if not index_path.exists():
            return {
                'status': 404,
                'body': 'PulZ UI not built. Run: cd control-room && pnpm build'
            }

        with open(index_path, 'r') as f:
            content = f.read()

        return {
            'status': 200,
            'headers': {'Content-Type': 'text/html'},
            'body': content
        }

    def serve_static(self, path: str):
        """Serve static files from the Next.js build."""
        file_path = Path(self.build_path) / path

        # Security: Prevent directory traversal
        if not file_path.resolve().is_relative_to(Path(self.build_path).resolve()):
            return {
                'status': 403,
                'body': 'Forbidden'
            }

        if not file_path.exists():
            return {
                'status': 404,
                'body': 'Not found'
            }

        # Determine content type
        content_type = self._get_content_type(file_path)

        # Read and serve file
        with open(file_path, 'rb') as f:
            content = f.read()

        return {
            'status': 200,
            'headers': {'Content-Type': content_type},
            'body': content
        }

    def _get_content_type(self, file_path: Path) -> str:
        """Determine content type from file extension."""
        ext = file_path.suffix.lower()

        content_types = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
        }

        return content_types.get(ext, 'application/octet-stream')

    def get_sidebar_items(self) -> list:
        """
        Return sidebar navigation items for OpenWebUI.
        """
        if not self.enabled:
            return []

        return [
            {
                'label': 'PulZ Revenue',
                'icon': 'currency-dollar',
                'items': [
                    {
                        'label': 'Opportunities',
                        'path': '/pulz/opportunities',
                        'icon': 'inbox',
                    },
                    {
                        'label': 'Drafts',
                        'path': '/pulz/drafts',
                        'icon': 'document-text',
                    },
                    {
                        'label': 'Jobs',
                        'path': '/pulz/jobs',
                        'icon': 'cog',
                    },
                    {
                        'label': 'Revenue',
                        'path': '/pulz/revenue',
                        'icon': 'chart-bar',
                    },
                ]
            }
        ]

    def get_status(self) -> dict:
        """Return extension status for health checks."""
        return {
            'name': NAME,
            'version': VERSION,
            'enabled': self.enabled,
            'build_path': self.build_path,
            'build_exists': self._check_build_exists(),
        }


# Initialize extension
extension = PulzExtension()

# Export for OpenWebUI
def init():
    """Initialize the PulZ extension."""
    print(f"[PulZ] Initializing {NAME} v{VERSION}")
    print(f"[PulZ] Build path: {extension.build_path}")
    print(f"[PulZ] Status: {'enabled' if extension.enabled else 'disabled (build not found)'}")
    return extension

def get_routes():
    """Get routes for OpenWebUI router."""
    return extension.get_routes()

def get_sidebar_items():
    """Get sidebar items for OpenWebUI navigation."""
    return extension.get_sidebar_items()

def get_status():
    """Get extension status."""
    return extension.get_status()
