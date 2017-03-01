# Hello World

This is a 100% static site with some neat blog-like features, an ultra simple codebase, and is also 100% open-source! In fact, you're reading the [README.md](https://github.com/erulabs/seandonmooy.com/blob/master/README.md) right now!

It's also about the 15th rewrite of this site, so thanks for coming back!

## Design

### Single server?
Yeah, yeah, it's not on S3 or GCS, etc. I've grown tired of their lack of options and sub-par performance. Additionally, the lack of capacity, insane amount of cost, and lack of features of almost all CDN providers is prohibative to using a bucket setup. If one reaches the point where traffic can cripple a single box, it should be very easy to change the `./bin/deploy.sh` script to use `gcloud` or `aws` or anything else instead of `rsync` and pay for a CDN provider - However, this site is designed for ultra low cost and bleeding edge features (http2, A+ SSL)
### Vue v React
I've been learning both - and as I am primarily a devops / database engineer and thus frontend development scares me, I have chosen to go with Vue for its simplicity. Additionally, vue weighs a lot less, and this site is very simple!
### Webpack and Gulp?
Yes, both... I have yet to decide the best setup for SPA development - pull requests welcome! I have intentionally _not_ included the files directly into the webpack bundle, this is mostly to keep the output JS as small and simple as possible. I would like to disable more transformations and remove more dependencies if possible!

## Setup
The only missing bits from the repository are as follows:

### 0. How to develop locally:
Just run `./bin/dev.sh`, that's all!

### 1. A server you can SSH to:
(As the `circleci` user)

This one is pretty simple - Take a look at `./bin/_variables.sh` and `./bin/deploy.sh`. Additionally, you'll need a directory that is writable: `mkdir /home/circleci/yoursite.com`

If this is the only site you're hosting, you literally cannot go small enough here. The site is entirely static and we'll work hard to cache and minify it aggressively.

### 2. A non-ssl bootstrap:
First, modify all the references to my website in `./bin/`. I was a bit lazy about this - sorry...

Assuming you don't already have SSL certificates and want to use the LetsEncrypt setup here, you'll need to comment out the [SSL section of the nginx configuration](https://github.com/erulabs/seandonmooy.com/blob/master/inf/nginx/seandonmooy.conf#L12-L43) and run `./bin/deploy.sh`, then `./bin/letsencrypt.sh` - IE: You need a working HTTP service to collect your SSL certificates.

### 3. Permissions for the `circleci` user
The circleci user needs to be allowed to run two commands - copying the nginx configuration file and reloading nginx (see `./bin/deploy.sh`). You'll want to add:
```bash
Cmnd_Alias DEPLOY_CMDS = /bin/cp /home/circleci/seandonmooy.com/inf/nginx/seandonmooy.conf /etc/nginx/sites-enabled/seandonmooy.conf, /usr/sbin/service nginx reload
circleci ALL=(ALL) NOPASSWD: DEPLOY_CMDS
```
to your `/etc/sudoers` file with `visudo`. Obviously, you'll also want to add an SSH key that circleci can use to deploy with!

### 4. Some blog posts!

Just modify posts in `./src/posts/` while running `./bin/dev.sh`!
