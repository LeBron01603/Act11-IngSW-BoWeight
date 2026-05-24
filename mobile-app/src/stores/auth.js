/* === Almacén de Autenticación === */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';

export const useAlmacenAuth = defineStore('auth', () => {
  /* Estado */
  let usuarioInicial = null;
  try {
    const almacenado = localStorage.getItem('bw_usuario');
    if (almacenado && almacenado !== 'undefined' && almacenado !== 'null') {
      usuarioInicial = JSON.parse(almacenado);
    }
  } catch (e) {
    console.error('Error al inicializar usuario desde localStorage:', e);
    localStorage.removeItem('bw_usuario');
  }

  const usuario = ref(usuarioInicial);
  const token = ref(localStorage.getItem('bw_token') || '');
  const cargando = ref(false);
  const error = ref('');

  /* Getters */
  const estaAutenticado = computed(() => !!token.value && !!usuario.value);
  const nombreCompleto = computed(() => usuario.value ? usuario.value.name : '');
  const rolUsuario = computed(() => usuario.value?.rol || usuario.value?.role || 'ganadero');

  /* Acciones */
  async function iniciarSesion(credenciales) {
    cargando.value = true;
    error.value = '';
    try {
      const respuesta = await api.post('/login', {
        email: credenciales.correo,
        password: credenciales.contrasena
      });
      
      const { datos, token_acceso } = respuesta.data;

      usuario.value = datos;
      token.value = token_acceso;
      localStorage.setItem('bw_usuario', JSON.stringify(datos));
      localStorage.setItem('bw_token', token_acceso);
      
      return { exito: true };
    } catch (err) {
      error.value = err.response?.data?.mensaje || 'Credenciales incorrectas. Intente nuevamente.';
      return { exito: false, error: error.value };
    } finally {
      cargando.value = false;
    }
  }

  function iniciarSesionInvitado(datosInvitacion) {
    const { token: tokenInvitado, usuario: usuarioInvitado } = datosInvitacion;
    usuario.value = usuarioInvitado;
    token.value = tokenInvitado;
    localStorage.setItem('bw_usuario', JSON.stringify(usuarioInvitado));
    localStorage.setItem('bw_token', tokenInvitado);
  }

  async function cerrarSesion() {
    try {
      await api.post('/logout');
    } catch (err) {
      console.error('Error al cerrar sesión en el servidor', err);
    } finally {
      usuario.value = null;
      token.value = '';
      localStorage.removeItem('bw_usuario');
      localStorage.removeItem('bw_token');
    }
  }

  async function obtenerPerfil() {
    try {
      const respuesta = await api.get('/perfil');
      usuario.value = respuesta.data.datos;
      localStorage.setItem('bw_usuario', JSON.stringify(respuesta.data.datos));
    } catch (err) {
      console.error('Error al obtener perfil', err);
    }
  }

  async function recuperarContrasena(correo) {
    cargando.value = true;
    try {
      // Nota: Implementar endpoint en Laravel si es necesario
      await new Promise(r => setTimeout(r, 1000));
      return { exito: true, mensaje: 'Se envió un enlace de recuperación a su correo.' };
    } finally {
      cargando.value = false;
    }
  }

  return {
    usuario, token, cargando, error,
    estaAutenticado, nombreCompleto, rolUsuario,
    iniciarSesion, cerrarSesion, obtenerPerfil, recuperarContrasena, iniciarSesionInvitado
  };
});
