## Commands to deploy the code in GitHub pages

1. Build the Angular project for production with the correct base href (replace the repo name if needed):

    ```powershell
    ng build --base-href /chennai-metro-ng/
    ```

2. Deploy to GitHub Pages using the Angular CLI deploy tool:

    ```powershell
    npx angular-cli-ghpages --dir=dist/chennai-metro-ng
    ```

3. Access your app at:

    ```
    https://jjchandru.github.io/chennai-metro-ng/
    ```

> Repeat steps 1 and 2 every time you want to update the deployed site.
