function x = istft(X,H,w)
% x:  Input signal
% N:  Frame length
% w:  window function of length N

M = size(X,2);
N = size(X,1);
signalLength = (M-1)*H + N;
winPos = (0:M-1) * H + 1;

% audio calculation
x = zeros(signalLength,1);
ow = zeros(signalLength,1); % sum of the overlapping windows
for m = 1 : M
    Xm = X(:,m);
    xm = real(ifft(Xm));
    xmw = xm .* w;
    x(winPos(m):winPos(m)+N-1) = x(winPos(m):winPos(m)+N-1) + xmw;
    ow(winPos(m):winPos(m)+N-1) = ow(winPos(m):winPos(m)+N-1) + w.^2;
end

ow(ow<1) = 1;
x = x ./ ow;

end
