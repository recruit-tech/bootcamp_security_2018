require "base64"
class ChatChannel < ApplicationCable::Channel
  def subscribed
    # xorで暗号化されたchannel_idを復号する
    channel_id = xorString(Base64.decode64(params[:channel_id].to_s)).split(":")
    my_id = channel_id[1].to_s
    friend_id = channel_id[2].to_s
    if friend_id.to_i > 0 then
      room_id = my_id.to_i < friend_id.to_i ? my_id+"-"+friend_id : friend_id+"-"+my_id
      stream_from 'chat_channel_'+room_id
      data = {"friend_id":my_id}
      ActionCable.server.broadcast('notification_channel_'+friend_id, data)
    else
      stream_from 'notification_channel_'+my_id
    end
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end

  def post(data)
    ActionCable.server.broadcast('chat_channel_'+data["message"]["room_id"].to_s, data)
  end

  def xorString(input_bytes)
    key = "S3cUR1Ty_k3Y1234".bytes;
    output = [];
    keyIndex = 0;
    for i in 0..(input_bytes.bytesize-1) do
      output[i] = [(input_bytes.bytes[i].to_i ^ key[keyIndex].to_i).to_s(16)].pack('H*')
      keyIndex = (keyIndex+1) % key.size
    end
    return output.join("");
  end

end
