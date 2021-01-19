# Mirror with Robocopy - Windows Only

This action mirror current project directory to destination folder using Robocopy (Windows only) with /MIR switch. It checks if the destination folder has the same repository and that it is clean.

## Input

### `destination`

**Required** Destination folder to mirror to.

## Example usage

```
uses: sarantoo/robocopy-action@v1
with:
  destination: c:\inetpub\wwwroot\myproject
```