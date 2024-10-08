import React, { PropsWithChildren } from 'react';

import UserProvider from './src/providers/firebaseProvider';
import SidebarProvider from './src/providers/sidebarProvider';

export default function AppProvider({ children }: PropsWithChildren) {
	return (
		<UserProvider>
			<SidebarProvider>{children}</SidebarProvider>
		</UserProvider>
	);
}
