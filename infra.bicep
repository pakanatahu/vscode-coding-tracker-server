
param location      string = resourceGroup().location
param appName       string
param skuName       string = 'F1'
param uploadToken   string

resource plan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: '${appName}-plan'
  location: location
  sku: { name: skuName }
  kind: 'linux'
}

resource webApp 'Microsoft.Web/sites@2022-03-01' = {
  name: appName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: plan.id
    siteConfig: {
      linuxFxVersion: 'NODE|22-lts'
      appCommandLine: 'node app.js -t $UPLOAD_TOKEN'
      appSettings: [
        { name: 'UPLOAD_TOKEN', value: uploadToken }
      ]
    }
  }
}
