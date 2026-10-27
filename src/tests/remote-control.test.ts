import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  GET as remoteControlGET,
  POST as remoteControlPOST,
  PUT as remoteControlPUT,
} from '@/app/api/children/[childId]/remote-control/route';
import { getSessionUser } from '@/lib/auth/session';
import { authorizeChildAccess } from '@/lib/security/policies';
import { ChildSessionControlModel } from '@/models/ChildSessionControl';

vi.mock('@/lib/auth/session', () => ({
  getSessionUser: vi.fn(),
}));

vi.mock('@/lib/security/policies', () => ({
  authorizeChildAccess: vi.fn(),
}));

vi.mock('@/lib/db/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/models/ChildSessionControl', () => ({
  ChildSessionControlModel: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

describe('Control Remoto Asistido del Modo Niño (Opción B)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('permite a la tablet del niño reportar latido/sección y obtener comandos pendientes', async () => {
    const mockSession = {
      childId: 'child_1',
      lastHeartbeat: new Date(),
      currentRoute: '/child/child_1/calm',
      currentSection: 'Rincón de Calma (Relajación) 🧘',
      activeCommand: {
        commandId: 'cmd-1',
        action: 'navigate',
        targetRoute: '/child/child_1/calm',
        message: 'Vamos a respirar con calma',
        createdAt: new Date(),
        executedAt: null,
      },
      locked: false,
    };

    (ChildSessionControlModel.findOneAndUpdate as any).mockResolvedValue(mockSession);

    const req = new NextRequest(
      'http://localhost:3000/api/children/child_1/remote-control?role=child&route=/child/child_1/calm&section=Rinc%C3%B3n%20de%20Calma'
    );

    const res = await remoteControlGET(req, { params: { childId: 'child_1' } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.activeCommand).toBeDefined();
    expect(data.activeCommand.commandId).toBe('cmd-1');
    expect(data.activeCommand.targetRoute).toBe('/child/child_1/calm');
    expect(ChildSessionControlModel.findOneAndUpdate).toHaveBeenCalledWith(
      { childId: 'child_1' },
      expect.objectContaining({
        $set: expect.objectContaining({
          currentRoute: '/child/child_1/calm',
        }),
      }),
      expect.any(Object)
    );
  });

  it('permite al tutor emitir una orden para enviar al niño al Rincón de Calma', async () => {
    (getSessionUser as any).mockResolvedValue({
      userId: 'tutor_1',
      role: 'tutor',
    });

    (authorizeChildAccess as any).mockResolvedValue({
      authorized: true,
      isOwner: true,
    });

    (ChildSessionControlModel.findOneAndUpdate as any).mockResolvedValue({
      childId: 'child_1',
      locked: false,
    });

    const req = new NextRequest('http://localhost:3000/api/children/child_1/remote-control', {
      method: 'POST',
      body: JSON.stringify({
        action: 'navigate',
        targetRoute: '/child/child_1/calm',
        message: 'Vamos a tomar una pausa para respirar y relajarnos 🧘',
        speakVoice: true,
      }),
    });

    const res = await remoteControlPOST(req, { params: { childId: 'child_1' } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.activeCommand.action).toBe('navigate');
    expect(data.activeCommand.targetRoute).toBe('/child/child_1/calm');
    expect(data.activeCommand.message).toContain('respirar y relajarnos');
  });

  it('permite al tutor bloquear/activar el Modo Enfoque en la tablet del niño', async () => {
    (getSessionUser as any).mockResolvedValue({
      userId: 'tutor_1',
      role: 'tutor',
    });

    (authorizeChildAccess as any).mockResolvedValue({
      authorized: true,
      isOwner: true,
    });

    (ChildSessionControlModel.findOneAndUpdate as any).mockResolvedValue({
      childId: 'child_1',
      locked: true,
    });

    const req = new NextRequest('http://localhost:3000/api/children/child_1/remote-control', {
      method: 'POST',
      body: JSON.stringify({
        action: 'lock',
        locked: true,
        message: 'Modo Enfoque activado',
      }),
    });

    const res = await remoteControlPOST(req, { params: { childId: 'child_1' } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.locked).toBe(true);
  });

  it('confirma la ejecución del comando cuando la tablet del niño lo procesa (PUT)', async () => {
    (ChildSessionControlModel.findOneAndUpdate as any).mockResolvedValue({
      childId: 'child_1',
    });

    const req = new NextRequest('http://localhost:3000/api/children/child_1/remote-control', {
      method: 'PUT',
      body: JSON.stringify({ commandId: 'cmd-123' }),
    });

    const res = await remoteControlPUT(req, { params: { childId: 'child_1' } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(ChildSessionControlModel.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        childId: 'child_1',
        'activeCommand.commandId': 'cmd-123',
      }),
      expect.objectContaining({
        $set: expect.objectContaining({
          'activeCommand.executedAt': expect.any(Date),
        }),
      })
    );
  });

  it('deniega el control remoto a usuarios no autorizados (403)', async () => {
    (getSessionUser as any).mockResolvedValue({
      userId: 'unauthorized_user',
      role: 'teacher',
    });

    (authorizeChildAccess as any).mockResolvedValue({
      authorized: false,
      reason: 'No tienes acceso a este niño',
    });

    const req = new NextRequest('http://localhost:3000/api/children/child_1/remote-control', {
      method: 'POST',
      body: JSON.stringify({
        action: 'navigate',
        targetRoute: '/child/child_1/calm',
      }),
    });

    const res = await remoteControlPOST(req, { params: { childId: 'child_1' } });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe('No tienes acceso a este niño');
  });
});
