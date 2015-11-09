function P = stp(x,N,H)
% x:  Input signal
% N:  Frame length
% H:  Hopsize


% Pad the audio to avoid problems at the end
xPadded = [x;zeros(N,1)];

M = floor(length(x)/H + 1);
winPos = (0:M-1) * H + 1;

% power calculation
P = zeros(M,1);
for m = 1 : M
    xm = xPadded(winPos(m):winPos(m) + N - 1);
    P(m) = sum(xm.^2)/N;
end

end
