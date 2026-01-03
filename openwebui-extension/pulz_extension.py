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

import json
import os
from typing import Optional, Any
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
        self.public_base_path = '/pulz'
        self.base_dir = self._resolve_base_dir()
        self.asset_dir = self._resolve_asset_dir()
        self.enabled = self._check_build_exists()

    def _resolve_base_dir(self) -> Path:
        """
        Resolve the actual base directory of the Next.js export.

        When built with basePath=/pulz, the export is nested under /pulz.
        """
        build_dir = Path(self.build_path)
        if (build_dir / 'pulz' / 'index.html').exists():
            return build_dir / 'pulz'
        return build_dir

    def _resolve_asset_dir(self) -> Path:
        build_dir = Path(self.build_path)
        if (self.base_dir / '_next').exists():
            return self.base_dir
        if (build_dir / '_next').exists():
            return build_dir
        return self.base_dir

    def _check_build_exists(self) -> bool:
        """Check if the PulZ build exists."""
        build_dir = self.base_dir
        index_file = build_dir / 'index.html'

        if not index_file.exists():
            print(f"[PulZ] Warning: Build not found at {self.build_path}")
            print(f"[PulZ] Run 'cd control-room && pnpm build' to generate the UI")
            return False

        return True

    def _get_user_from_request(self, request: Optional[Any] = None, user: Optional[Any] = None) -> Optional[Any]:
        if user is not None:
            return user

        if request is None:
            return None

        if isinstance(request, dict):
            return request.get('user')

        if hasattr(request, 'user'):
            return getattr(request, 'user')

        if hasattr(request, 'state') and hasattr(request.state, 'user'):
            return getattr(request.state, 'user')

        return None

    def _require_user(self, request: Optional[Any] = None, user: Optional[Any] = None) -> Optional[Any]:
        user_obj = self._get_user_from_request(request=request, user=user)
        if not user_obj:
            return None
        return user_obj

    def _user_to_payload(self, user_obj: Any) -> dict:
        allowed_keys = {'id', 'display_name', 'role'}

        if isinstance(user_obj, dict):
            disallowed = set(user_obj.keys()) - allowed_keys
            if disallowed:
                raise ValueError(f"Disallowed user fields: {', '.join(sorted(disallowed))}")
            payload = {key: user_obj.get(key) for key in allowed_keys}
        else:
            payload = {key: getattr(user_obj, key, None) for key in allowed_keys}

        if set(payload.keys()) != allowed_keys:
            raise ValueError("User payload keys are not allowlisted")

        if any(payload[key] is None for key in allowed_keys):
            raise ValueError("User payload missing required fields")

        return payload

    def safe_json_for_script(self, obj: Any) -> str:
        payload = json.dumps(obj, ensure_ascii=True)
        return payload.replace("</", "<\\/")

    def _inject_user_payload(self, content: str, user_obj: Any) -> str:
        payload = self._user_to_payload(user_obj)
        safe_payload = self.safe_json_for_script(payload)
        script_tag = f"<script>window.__PULZ_USER__ = {safe_payload};</script>"

        if '</head>' in content:
            return content.replace('</head>', f'{script_tag}</head>')
        return f'{script_tag}\n{content}'

    def _rewrite_asset_paths(self, content: str) -> str:
        if f'{self.public_base_path}/_next/' not in content and '/_next/' in content:
            content = content.replace('"/_next/', f'"{self.public_base_path}/_next/')
            content = content.replace("'/_next/", f"'{self.public_base_path}/_next/")
        return content

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

    def serve_index(self, request: Optional[Any] = None, user: Optional[Any] = None):
        """Serve the PulZ index page."""
        user_obj = self._require_user(request=request, user=user)
        if not user_obj:
            return {
                'status': 401,
                'body': 'Unauthorized'
            }

        index_path = self.base_dir / 'index.html'

        if not index_path.exists():
            return {
                'status': 404,
                'body': 'PulZ UI not built. Run: cd control-room && pnpm build'
            }

        with open(index_path, 'r') as f:
            content = f.read()

        content = self._rewrite_asset_paths(content)
        try:
            content = self._inject_user_payload(content, user_obj)
        except ValueError:
            return {
                'status': 500,
                'body': 'Invalid user payload'
            }

        return {
            'status': 200,
            'headers': {'Content-Type': 'text/html; charset=utf-8'},
            'body': content
        }

    def serve_static(self, path: str, request: Optional[Any] = None, user: Optional[Any] = None):
        """Serve static files from the Next.js build."""
        user_obj = self._require_user(request=request, user=user)
        if not user_obj:
            return {
                'status': 401,
                'body': 'Unauthorized'
            }

        base_dir = self.base_dir
        asset_dir = self.asset_dir
        target_dir = asset_dir if path.startswith('_next/') else base_dir
        file_path = (target_dir / path).resolve()

        # Security: Prevent directory traversal
        if not file_path.is_relative_to(target_dir.resolve()):
            return {
                'status': 403,
                'body': 'Forbidden'
            }

        if file_path.is_dir():
            file_path = file_path / 'index.html'

        if not file_path.exists():
            index_fallback = target_dir / path / 'index.html'
            if index_fallback.exists():
                file_path = index_fallback
            else:
                fallback_path = (base_dir / path).resolve()
                if fallback_path.exists():
                    file_path = fallback_path
                else:
                    return {
                        'status': 404,
                        'body': 'Not found'
                    }

        if not file_path.exists():
            return {
                'status': 404,
                'body': 'Not found'
            }

        # Determine content type
        content_type = self._get_content_type(file_path)

        # Read and serve file
        if file_path.suffix.lower() == '.html':
            with open(file_path, 'r') as f:
                content = f.read()
            content = self._rewrite_asset_paths(content)
            try:
                content = self._inject_user_payload(content, user_obj)
            except ValueError:
                return {
                    'status': 500,
                    'body': 'Invalid user payload'
                }
        else:
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
            '.html': 'text/html; charset=utf-8',
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
                        'label': 'Dashboard',
                        'path': '/pulz',
                        'icon': 'home',
                    },
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
                    {
                        'label': 'Activity',
                        'path': '/pulz/activity',
                        'icon': 'clock',
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
