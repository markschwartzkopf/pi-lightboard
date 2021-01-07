# pi-lightboard
## \*\*Not yet functional\*\*
## To setup Raspberry Pi:
- Install Raspberry Pi OS. This is tested with Raspberry Pi OS Lite, but should work with any version.
- Run `sudo raspi-config` on pi
	- Change user password
	- Set locale (For me, from en_GB. UTF-8 ; to en_US. UTF-8)
	- Set time zone (For me, to America->Chicago)
	- Set keyboard (For me, Generic 104-key PC -> Other -> English (US) )
	- *Set SSH (Interfacing Options -> SSH -> Yes)
- *Set up SSH:
	- `ssh-keygen`
	- ssh in with the development PC
	- `nano .ssh/authorized_keys`, paste public key from development account's ~/.ssh/id_rsa.pub, save
	- on development PC, add entry to ~/.ssh/config with correct Host (name for development ssh) and HostName (ip) and User (username on pi)
- Add Node repo, using "curl" command from Ubuntu instructions on [node.dev/node-binary](https://node.dev/node-binary)
- Update pi software: `sudo apt full-upgrade -y`
- Install Node on pi: `sudo apt install -y nodejs`
- Allow node to access port 80: `sudo setcap cap_net_bind_service=+ep /usr/bin/node`
- Install git: 
	- `sudo apt install -y git`
	- `git config --global user.email "mark@schwartzkopf.org"`
	- `git config --global user.name "Mark Schwartzkopf"`
- Pull from github: `git clone https://github.com/markschwartzkopf/pi-lightboard`
- Install pm2: `sudo npm install pm2 -g`
	- more info about installing pm2
- *VS Code: connect to Host

(*): for development

## Development

- Follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
- Use these [Commit Types](https://github.com/commitizen/conventional-commit-types/blob/master/index.json)
