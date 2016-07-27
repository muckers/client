// Auto-generated by avdl-compiler v1.3.1 (https://github.com/keybase/node-avdl-compiler)
//   Input file: avdl/notify_app.avdl

package keybase1

import (
	rpc "github.com/keybase/go-framed-msgpack-rpc"
	context "golang.org/x/net/context"
)

type ExitArg struct {
}

type NotifyAppInterface interface {
	Exit(context.Context) error
}

func NotifyAppProtocol(i NotifyAppInterface) rpc.Protocol {
	return rpc.Protocol{
		Name: "keybase.1.NotifyApp",
		Methods: map[string]rpc.ServeHandlerDescription{
			"exit": {
				MakeArg: func() interface{} {
					ret := make([]ExitArg, 1)
					return &ret
				},
				Handler: func(ctx context.Context, args interface{}) (ret interface{}, err error) {
					err = i.Exit(ctx)
					return
				},
				MethodType: rpc.MethodNotify,
			},
		},
	}
}

type NotifyAppClient struct {
	Cli rpc.GenericClient
}

func (c NotifyAppClient) Exit(ctx context.Context) (err error) {
	err = c.Cli.Notify(ctx, "keybase.1.NotifyApp.exit", []interface{}{ExitArg{}})
	return
}
