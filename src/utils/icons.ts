import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

// Nomes válidos de ícones do Ionicons (usado nas props `icon` dos componentes).
export type IconName = ComponentProps<typeof Ionicons>['name'];