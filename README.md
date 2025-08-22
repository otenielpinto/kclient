# KClient Service API HTTP Win32 NodeJS

Api para integracao software Super Empresarial com Komache Hub Corporate

# instalar node no windows como serviço - Windows Services

Instalação do Serviço KClient

```
install_win32.bat
```

# Para desinstalar

Desinstalação do Serviço KClient

```
node service_uninstall.js
```

# Requisitos

Ter instalado o pacote <https://www.npmjs.com/package/node-windows/>

```
node-windows

```

#

# Liberar porta do firewall

#

## Windows

Para liberar a porta 3501 no firewall do Windows, execute o seguinte comando no PowerShell como administrador:

```
New-NetFirewallRule -DisplayName "KClient Win32" -Direction Inbound -LocalPort 3501 -Protocol TCP -Action Allow
```

Ou, via CMD como administrador:

```
netsh advfirewall firewall add rule name="KClient Win32" dir=in action=allow protocol=TCP localport=3501
```

## Excluir regra no Windows (CMD)

Para remover a regra da porta 3501 criada anteriormente via CMD, execute como administrador:

```
netsh advfirewall firewall delete rule name="KClient Win32"
```

## Linux (UFW)

Para liberar a porta 3501 usando o UFW (Uncomplicated Firewall), execute:

```
sudo ufw allow 3501/tcp
```

Se estiver usando o firewalld:

```
sudo firewall-cmd --add-port=3501/tcp --permanent
sudo firewall-cmd --reload
```
