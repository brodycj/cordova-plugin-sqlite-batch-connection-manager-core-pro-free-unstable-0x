// Copyright 2020-present Christopher J. Brody <chris.brody+brodybits@gmail.com>

#import <Cordova/CDVPlugin.h>

@interface SQLiteBatchConnectionManager : CDVPlugin

- (void) openDatabaseConnection : (CDVInvokedUrlCommand *) command;

@end

@implementation SQLiteBatchConnectionManager

- (void) openDatabaseConnection : (CDVInvokedUrlCommand *) command
{
  CDVPluginResult * result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:command.arguments];;
  [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

@end
