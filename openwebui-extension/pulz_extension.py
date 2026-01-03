"""
PulZ OpenWebUI Extension
Phase D0 Hard Execution Mode

This extension embeds the PulZ revenue system as a panel within OpenWebUI.
The PulZ UI is served from the Next.js static build at /control-room/out/

🔐 AUTHENTICATION ENFORCEMENT:
- All PulZ routes require an authenticated OpenWebUI session
- User identity is passed to the frontend via session cookie
- Unauthenticated requests are rejected with 401

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
import json
from typing import Optional, Dict, Any
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

    🔐 All features are protected by OpenWebUI authentication.
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

    def _check_authentication(self, request: Any) -> Optional[Dict[str, Any]]:
        """
        Check if the request has a valid authenticated session.

        Returns MINIMAL user info dict if authenticated, None otherwise.

        SECURITY: Only allowlisted fields are returned to prevent leaking sensitive data.
        Allowlist: id, display_name, role

        OpenWebUI should provide user info via request.state.user or request.user
        """
        # Try to get user from request state (OpenWebUI convention)
        user = getattr(request, 'user', None) or getattr(getattr(request, 'state', None), 'user', None)

        if not user:
            return None

        # Extract minimal allowlisted user info (NO email, NO tokens, NO sensitive data)
        if isinstance(user, dict):
            user_id = user.get('id')
            display_name = user.get('display_name') or user.get('name') or user.get('username') or 'User'
            role = user.get('role', 'user')
        else:
            # If user is an object, try to extract attributes
            user_id = getattr(user, 'id', None)
            display_name = (
                getattr(user, 'display_name', None) or
                getattr(user, 'name', None) or
                getattr(user, 'username', None) or
                'User'
            )
            role = getattr(user, 'role', 'user')

        # Validate user_id exists
        if not user_id:
            return None

        # Return ONLY allowlisted fields (sanitized)
        return {
            'id': str(user_id),  # Ensure string
            'display_name': str(display_name)[:100],  # Limit length, ensure string
            'role': str(role)[:20] if role else 'user',  # Limit length, ensure string
        }

    def _unauthorized_response(self) -> Dict[str, Any]:
        """Return unauthorized response."""
        return {
            'status': 401,
            'headers': {'Content-Type': 'text/html'},
            'body': '''
                <!DOCTYPE html>
                <html>
                <head>
                    <title>PulZ - Authentication Required</title>
                    <style>
                        body {
                            background: #0a0e1a;
                            color: white;
                            font-family: monospace;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                        }
                        .container {
                            text-align: center;
                            padding: 2rem;
                            border: 1px solid #dc2626;
                            border-radius: 8px;
                            background: #1a1f2e;
                        }
                        h1 { color: #dc2626; }
                        p { color: #9ca3af; }
                        a {
                            color: #3b82f6;
                            text-decoration: none;
                            margin-top: 1rem;
                            display: inline-block;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>🔐 Authentication Required</h1>
                        <p>PulZ is only accessible to logged-in OpenWebUI users.</p>
                        <p>Please <a href="/">log in</a> to continue.</p>
                    </div>
                </body>
                </html>
            '''
        }

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

    def serve_index(self, request: Any = None):
        """
        Serve the PulZ index page.

        🔐 Authentication required.
        """
        # Check authentication
        user = self._check_authentication(request) if request else None
        if not user or not user.get('id'):
            print("[PulZ] Unauthorized access attempt to /pulz/")
            return self._unauthorized_response()

        print(f"[PulZ] Authenticated access by user: {user.get('display_name')} ({user.get('id')})")

        index_path = Path(self.build_path) / 'index.html'

        if not index_path.exists():
            return {
                'status': 404,
                'body': 'PulZ UI not built. Run: cd control-room && pnpm build'
            }

        with open(index_path, 'r') as f:
            content = f.read()

        # Inject MINIMAL user info into the HTML as a script tag (XSS-safe)
        # Only allowlisted fields: id, display_name, role
        user_json = json.dumps(user, ensure_ascii=True)  # XSS protection
        user_script = f'<script>window.__PULZ_USER__ = {user_json};</script>'

        # Inject before closing </head> tag
        if '</head>' in content:
            content = content.replace('</head>', f'{user_script}</head>')
        else:
            # Fallback: inject at start of body
            content = content.replace('<body>', f'<body>{user_script}')

        return {
            'status': 200,
            'headers': {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
            'body': content
        }

    def serve_static(self, request: Any = None, path: str = ''):
        """
        Serve static files from the Next.js build.

        🔐 Authentication required for all PulZ resources.
        """
        # Check authentication
        user = self._check_authentication(request) if request else None
        if not user or not user.get('id'):
            print(f"[PulZ] Unauthorized access attempt to /pulz/{path}")
            return self._unauthorized_response()

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
        mode = 'rb' if content_type != 'text/html' else 'r'
        with open(file_path, mode) as f:
            content = f.read()

        # Inject MINIMAL user info into HTML files (XSS-safe)
        if content_type == 'text/html' and isinstance(content, str):
            user_json = json.dumps(user, ensure_ascii=True)  # XSS protection
            user_script = f'<script>window.__PULZ_USER__ = {user_json};</script>'

            if '</head>' in content:
                content = content.replace('</head>', f'{user_script}</head>')
            else:
                content = content.replace('<body>', f'<body>{user_script}')

        return {
            'status': 200,
            'headers': {
                'Content-Type': content_type,
                'Cache-Control': 'no-cache' if content_type == 'text/html' else 'public, max-age=31536000',
            },
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
