function X = stft(x,N,H,w)
% x:  Input signal
% N:  Frame length
% H:  Hopsize
% w:  window function of length N


% Pad the audio to avoid problems at the end
xPadded = [x;zeros(N,1)];

M = floor(length(x)/H + 1);
winPos = (0:M-1) * H + 1;

% spectrogram calculation
X = zeros(N,M);
for m = 1 : M
    xm = xPadded(winPos(m):winPos(m) + N - 1) .* w;
    X(:,m) = fft(xm);
end

end
