import React, {
	PropsWithChildren,
	createContext,
	useContext,
	useState,
} from 'react';

const SidebarContext = createContext({
	open: true,
	setOpen: (open: boolean) => {},
});

export default function SidebarProvider({ children }: PropsWithChildren) {
	const [open, setOpen] = useState(true);

	return (
		<SidebarContext.Provider value={{ open, setOpen }}>
			{children}
		</SidebarContext.Provider>
	);
}

export const useSidebar = () => {
	return useContext(SidebarContext);
};
