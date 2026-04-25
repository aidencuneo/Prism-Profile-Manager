import { mount } from 'svelte';
import App from './App.svelte';

const mounted = mount(App, {
  target: document.getElementById('app'),
});

export default mounted;
