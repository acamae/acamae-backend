<?php
// Requiere HTTPS para acceder
$cfg['ForceSSL'] = true;
$cfg['PmaAbsoluteUri'] = 'https://localhost/phpmyadmin/';

// Autenticación más segura
$cfg['Servers'][1]['auth_type'] = 'cookie';
$cfg['Servers'][1]['AllowNoPassword'] = false; // obliga a usar contraseña
$cfg['LoginCookieValidity'] = 300;             // 5 minutos de sesión
$cfg['LoginCookieDeleteAll'] = true;           // borra cookies en logout

// Seguridad de red
$cfg['AllowArbitraryServer'] = false;          // no permitir conectarse a otro host
$cfg['TrustedProxies'] = ['127.0.0.1'];        // protege contra spoofing en cabeceras

// Ocultar bases de datos del sistema
$cfg['Servers'][1]['hide_db'] = '(information_schema|performance_schema|mysql|sys)';

// Prevención de comandos peligrosos
$cfg['ProtectBinary'] = true;
$cfg['DisableMultiTableMaintenance'] = true;   // evita DROP masivos
$cfg['AllowUserDropDatabase'] = false;         // evita DROP DATABASE (ajustable)

// Privacidad y anti-tracking
$cfg['SendErrorReports'] = 'never';
$cfg['CheckConfigurationPermissions'] = false; // oculta advertencias internas
$cfg['ShowPhpInfo'] = false;                   // oculta phpinfo()

// Tema y idioma por defecto
$cfg['ThemeDefault'] = 'pmahomme';
$cfg['DefaultLang'] = 'es-utf-8';

// Interfaz más segura y simple
$cfg['NavigationTreeEnableExpansion'] = true;
$cfg['NavigationTreeEnableGrouping'] = true;
$cfg['MaxRows'] = 100;                         // evita cargas excesivas

// Otros: evita exposición de scripts embebidos
$cfg['AllowThirdPartyFraming'] = false; 