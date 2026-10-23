import { createRoot } from 'react-dom/client';
import '@vkontakte/vkui/dist/vkui.css';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/shell.css';
import { App } from './app/App';

createRoot(document.getElementById('root')!).render(<App />);
