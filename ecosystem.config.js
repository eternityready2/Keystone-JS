module.exports = {
    apps: [
      {
        name: 'keystone-app',
        script: 'keystone',
        args: 'start',
        env: {
          NODE_ENV: 'production'
        }
      },
      {
        name: 'scheduler-app',
        script: 'node',
        args: 'scheduler.ts',
        env: {
          NODE_ENV: 'production'
        }
      }
    ]
  };
  