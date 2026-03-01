import React from 'react';
import Navigation from '@/components/Navigation';
import AIHealthAssistantPanel from '@/components/AIHealthAssistantPanel';

export default function ChatWithAI({ user, onLogout }) {
  return (
    <div
      className="min-h-screen pb-12"
      style={{ background: 'linear-gradient(135deg, hsl(30 20% 98%) 0%, hsl(146 35% 95%) 100%)' }}
    >
      <Navigation user={user} onLogout={onLogout} />

      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-heading font-bold text-foreground md:text-5xl">
            Asistente IA Médico
          </h1>
          <p className="text-lg text-muted-foreground">
            Chat clínico y recomendaciones en un solo espacio.
          </p>
        </div>

        <AIHealthAssistantPanel />
      </div>
    </div>
  );
}
