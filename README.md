<img src="./velocity-tech-test.png" alt="drawing" width="100%"/>

## Hello!

This readme file will explain how to setup and run this project locally.

Prerequisites:
- Git (https://git-scm.com/downloads/win)
- Node.js (LTS) + npm (https://nodejs.org/en/download)
- Shopify CLI v3+ - Install Node.js and npm first, then run the following:
```
npm install -g @shopify/cli
shopify version
```

## 1) Get the code

- Fork the repository by clicking the "Fork" dropdown on the top right and selecting "Create a new fork".
- Once in your forked depository, click the green "Code" button and copy the URL under "HTTPS". It will look something like this:
```
https://github.com/ChazTF/velocity-tech-test-cf.git
```
- Open your terminal on your IDE and clone your fork to your computer using the following command as an example:
```
git clone https://github.com/ChazTF/velocity-tech-test-cf.git
```
- Once cloned, you need to make sure you're working in the right directory.
```
cd velocity-tech-test-cf
```
To confirm you're in the right directory you can list the files by writing "dir"(Windows) or "ls" (Linux/macOS) in the terminal.

## 2) Connect to Shopify and access preview

- Connect by typing in the following to the terminal
```
shopify theme push --store=velocity-tech-test --password=shptka_ea1e90de841c7cdaeb2ce101dd28caa6
shopify theme list (find the theme ID for the one you just pushed)
shopify theme dev --store=velocity-tech-test --password=shptka_ea1e90de841c7cdaeb2ce101dd28caa6 --theme=<theme-ID>

```

- You'll now see inside the terminal it gives you several links, including your local development environment and the shopify preview link.

## 3) Run watcher on SCSS

- Package.json file is not included in the Github repo so type in the following to your terminal:
```
npm init -y
npm i -D sass
```
- Then add the following to your the package.json file that was just created:
```
"scripts": {
    "scss": "sass assets/scss/main.scss assets/theme.css --no-source-map",
    "scss:watch": "sass --watch assets/scss/main.scss assets/theme.css --no-source-map"
},

```
- Open another terminal in your IDE and input the following:
```
npm run scss:watch
```
You'll now have two terminals running, one is the shopify dev session that syncs to Shopify after each save, and the other is watching main.scss and updating theme.css on save. 

And now you're ready to rock! Just rememeber, you'll be on the main branch, so make sure you create a new branch for any edits, then commit and merge when you're ready. 
### Good Luck!

If you run into any issues or have any questions, feel free to reach out to a.pearson@digital-velocity.co.uk
