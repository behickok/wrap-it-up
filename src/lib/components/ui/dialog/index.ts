import { Dialog as DialogPrimitive } from 'bits-ui';
import Content from './dialog-content.svelte';
import Description from './dialog-description.svelte';
import Footer from './dialog-footer.svelte';
import Header from './dialog-header.svelte';
import Title from './dialog-title.svelte';
import Root from './dialog.svelte';

const Trigger = DialogPrimitive.Trigger;
const Close = DialogPrimitive.Close;

export {
	Root,
	Trigger,
	Content,
	Header,
	Footer,
	Title,
	Description,
	Close,
	//
	Root as Dialog,
	Content as DialogContent,
	Description as DialogDescription,
	Footer as DialogFooter,
	Header as DialogHeader,
	Title as DialogTitle,
	Trigger as DialogTrigger,
	Close as DialogClose
};
