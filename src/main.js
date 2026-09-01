import Alpine from 'alpinejs';
import { shellState } from './shell/shell-state.js';
import './css/theme.css';
import './css/shell.css';

window.Alpine = Alpine;
Alpine.data('shell', shellState);
Alpine.start();
