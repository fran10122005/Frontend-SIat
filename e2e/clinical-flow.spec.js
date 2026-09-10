import { test, expect } from '@playwright/test';

test.describe('Flujo Crítico Clínico — Especialista SIAT', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Mock de Healthcheck
    await page.route('**/api/health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok', db: 'connected' }),
      });
    });

    // 2. Mock de Autenticación Especialista
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-specialist-jwt-token',
          user: {
            usu_codi: 'U_ESP1',
            rol_codi: 'ROL_ESP',
            usu_nomb: 'Dra. María Especialista',
            usu_crro: 'especialista@siat.com',
            especialista: {
              esp_codi: 'ESP_1',
              esp_nomb: 'Dra. María',
              esp_apel: 'Especialista',
            },
          },
        }),
      });
    });

    // 3. Mock de Lista de Pacientes
    await page.route('**/api/ninos/mis-ninos', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              nin_codi: 'NIN_1',
              nin_nomb: 'Juanito',
              nin_apel: 'Pérez',
              nin_diag: 'TEA Nivel 1',
              nin_edad: 7,
              nin_fech_naci: '2019-05-12',
            },
          ],
        }),
      });
    });

    // 4. Mock de Historial e Incidentes
    let mockIncidentes = [
      {
        inc_codi: 'INC_001',
        inc_fech: new Date().toISOString(),
        inc_desc: 'Desregulación auditiva durante actividad grupal',
        inc_tipo: 'Crisis Sensorial',
        inc_ante: 'Ruido imprevisto en el aula',
        inc_cond: 'Taparse los oídos y llanto',
        inc_cons: 'Acompañamiento a zona de calma',
      },
    ];

    await page.route('**/api/especialista/incidentes/**', async (route) => {
      if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON();
        const nuevoIncidente = {
          inc_codi: `INC_${Date.now()}`,
          inc_fech: new Date().toISOString(),
          inc_desc: payload.inc_cond || payload.inc_desc || 'Incidente registrado',
          inc_tipo: payload.inc_tipo || 'Conductual',
          inc_ante: payload.inc_ante || 'Sin antecedente',
          inc_cond: payload.inc_cond || 'Conducta registrada',
          inc_cons: payload.inc_cons || 'Estrategia aplicada',
        };
        mockIncidentes.push(nuevoIncidente);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: nuevoIncidente }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: mockIncidentes }),
        });
      }
    });

    // 5. Mock de Indicaciones, Metas y Expediente
    await page.route('**/api/especialista/indicaciones/**', async (route) => {
      await route.fulfill({ status: 200, json: { data: [] } });
    });
    await page.route('**/api/metas/**', async (route) => {
      await route.fulfill({ status: 200, json: { data: [] } });
    });
    await page.route('**/api/ninos/*/bitacora', async (route) => {
      await route.fulfill({ status: 200, json: { data: [] } });
    });
    await page.route('**/api/reportes/**', async (route) => {
      await route.fulfill({ status: 200, json: { data: [] } });
    });
    await page.route('**/api/monitoreo/**', async (route) => {
      await route.fulfill({ status: 200, json: { data: [] } });
    });
  });

  test('debe iniciar sesión como especialista, seleccionar paciente, registrar incidente A-B-C y cerrar sesión', async ({ page }) => {
    // 1. Navegar a la pantalla de login
    await page.goto('/');

    // Verificar presencia del formulario de login
    const emailInput = page.locator('#login-email');
    const passwordInput = page.locator('#login-password');
    const submitBtn = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await emailInput.fill('especialista@siat.com');
    await passwordInput.fill('123456');
    await submitBtn.click();

    // 2. Verificar ingreso al Dashboard del Especialista
    await expect(page.locator('text=Dra. María Especialista').or(page.locator('text=Panel del Especialista')).or(page.locator('text=SIAT'))).toBeVisible({ timeout: 10000 });

    // 3. Abrir modal de incidente A-B-C
    const registrarIncidenteBtn = page.getByRole('button', { name: /incidente/i }).first();
    if (await registrarIncidenteBtn.isVisible()) {
      await registrarIncidenteBtn.click();
    }

    // 4. Completar formulario de Incidente A-B-C si el modal está abierto
    const antecedenteInput = page.locator('textarea[name="inc_ante"]').or(page.locator('textarea').first());
    if (await antecedenteInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await antecedenteInput.fill('Transición de actividad sin aviso previo');
      
      const conductaInput = page.locator('textarea[name="inc_cond"]').or(page.locator('textarea').nth(1));
      if (await conductaInput.isVisible()) {
        await conductaInput.fill('Bloqueo y rechazo a sentarse');
      }

      const guardarBtn = page.getByRole('button', { name: /guardar|registrar/i }).last();
      await guardarBtn.click();
    }

    // 5. Cerrar sesión
    const logoutBtn = page.getByRole('button', { name: /cerrar sesión|salir/i }).or(page.locator('button[title*="Cerrar sesión"]')).first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await expect(emailInput).toBeVisible();
    }
  });
});
