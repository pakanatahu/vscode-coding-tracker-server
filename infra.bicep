
param location      string = resourceGroup().location
param webAppName string = uniqueString(resourceGroup().id)
param skuName       string = 'F1'
param uploadToken   string
param linuxFxVersion string = 'node|22-lts'

resource plan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: '${webAppName}-plan'
  location: location
  sku: { name: skuName }
  kind: 'linux'
}

resource webApp 'Microsoft.Web/sites@2022-03-01' = {
  name: webAppName
  location: location
  properties: {
    serverFarmId: plan.id
    siteConfig: {
      linuxFxVersion: linuxFxVersion
      appCommandLine: 'node app.js -t $(UPLOAD_TOKEN)'
      appSettings: [
        { name: 'UPLOAD_TOKEN', value: uploadToken }
      ]
    }
  }
}
