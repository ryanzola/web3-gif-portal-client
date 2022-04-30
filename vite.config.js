import reactRefresh from '@vitejs/plugin-react-refresh'
import react from '@vitejs/plugin-react'

/**
 * https://vitejs.dev/config/
 * @type { import('vite').UserConfig }
 */
export default {
  plugins: [react(),reactRefresh()],
  server: {
    host: '0.0.0.0',
  }
}
