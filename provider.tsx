import React, { PropsWithChildren } from 'react';

import FirebaseProvider from './src/providers/firebaseProvider';
import SidebarProvider from './src/providers/sidebarProvider';

export default function AppProvider({ children }: PropsWithChildren) {
	return (
		<FirebaseProvider>
			<SidebarProvider>{children}</SidebarProvider>
		</FirebaseProvider>
	);
}
